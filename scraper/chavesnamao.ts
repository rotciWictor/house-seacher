import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import type { Property } from './index';

const dataPath = path.resolve('src/data/properties.json');
const MAX_PAGES = 10;
const BASE_URL = 'https://www.chavesnamao.com.br/imoveis-para-alugar/rj-rio-de-janeiro/?valormax=1000';

function classifyZone(text: string): string {
    const lower = text.toLowerCase();
    // Cities outside Rio
    if (lower.includes('niterói') || lower.includes('niteroi')) return 'Niterói';
    if (lower.includes('são gonçalo') || lower.includes('sao goncalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('são joão de meriti')) return 'Baixada';
    if (lower.includes('maricá')) return 'Maricá';
    if (lower.includes('petrópolis') || lower.includes('teresópolis')) return 'Serrana';
    if (lower.includes('mangaratiba') || lower.includes('angra') || lower.includes('paraty')) return 'Costa Verde';

    const oeste = ['campo grande','santa cruz','bangu','realengo','padre miguel','senador camará','cosmos','inhoaíba','paciência','sepetiba','guaratiba','pedra de guaratiba','barra de guaratiba','vargem grande','vargem pequena','recreio','barra da tijuca','jacarepaguá','taquara','tanque','pechincha','anil','curicica','freguesia','praça seca','vila valqueire','jardim sulacap','magalhães bastos','deodoro','vila militar','santíssimo','augusto vasconcelos','camorim','grumari','joá','itanhangá','barra olímpica','rio das pedras'];
    const norte = ['méier','madureira','cascadura','quintino','piedade','pilares','abolição','encantado','engenho de dentro','engenho novo','riachuelo','sampaio','todos os santos','cachambi','rocha','são francisco xavier','tijuca','andaraí','grajaú','maracanã','vila isabel','alto da boa vista','irajá','colégio','vicente de carvalho','vaz lobo','vila da penha','vila kosmos','penha','penha circular','olaria','ramos','bonsucesso','manguinhos','benfica','são cristóvão','higienópolis','caju','paquetá','ilha do governador','cocotá','praia da bandeira','ribeira','zumbi','tauá','bancários','cacuia','pitangueiras','jardim guanabara','cidade universitária','moneró','portuguesa','galeão','parada de lucas','vigário geral','cordovil','brás de pina','jardim américa','penha circular','honório gurgel','marechal hermes','bento ribeiro','osvaldo cruz','guadalupe','costa barros','barros filho','acari','parque colúmbia','coelho neto','pavuna','anchieta','ricardo de albuquerque','parque anchieta','cavalcanti','engenheiro leal','turiaçu','rocha miranda','lins de vasconcelos','engenho da rainha','tomás coelho','campinho','maria da graça','del castilho','inhaúma','higienópolis','jacaré','jacarezinho','mangueira','são carlos','estácio','catumbi','cidade nova','rio comprido','santa teresa','lapa','glória','centro'];
    const sul = ['copacabana','ipanema','leblon','botafogo','flamengo','laranjeiras','cosme velho','humaitá','urca','leme','gávea','jardim botânico','lagoa','são conrado','vidigal','rocinha','catete','consolação'];

    for (const b of oeste) if (lower.includes(b)) return 'Oeste';
    for (const b of norte) if (lower.includes(b)) return 'Norte';
    for (const b of sul) if (lower.includes(b)) return 'Sul';
    return 'Geral';
}

function extractPrice(text: string): number {
    // Match R$ 1.500 or R$ 800 patterns
    const match = text.match(/R\$\s*([\d.]+)/);
    if (!match) return 0;
    return parseInt(match[1].replace(/\./g, ''), 10);
}

function extractNumber(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    return match ? parseInt(match[1], 10) : 0;
}

async function scrapeChavesNaMao() {
    console.log(`🔍 Starting Chaves na Mão scraper (${MAX_PAGES} pages)...\n`);

    let properties: Property[] = [];
    try {
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf-8');
            if (raw.trim()) properties = JSON.parse(raw);
        }
    } catch (e) {
        console.error('Could not read existing data, starting fresh.', e);
    }

    // Remove old chaves listings (older than 3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    properties = properties.filter(p => p.source !== 'chavesnamao' || p.found_at > threeDaysAgo);

    const existingIds = new Set(properties.map(p => p.id));
    let totalNew = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const pageUrl = page === 1 ? BASE_URL : `${BASE_URL}&pagina=${page}`;
        console.log(`   📄 Page ${page}/${MAX_PAGES}: ${pageUrl}`);

        try {
            const res = await fetch(pageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                }
            });

            if (!res.ok) {
                console.log(`   ❌ Page ${page} returned ${res.status}`);
                break;
            }

            const html = await res.text();
            const $ = cheerio.load(html);

            // Find all property links
            const links = $('a[href*="/imovel/"]');
            let pageNew = 0;

            links.each((_, el) => {
                try {
                    const $el = $(el);
                    const href = $el.attr('href') || '';
                    const fullUrl = href.startsWith('http') ? href : `https://www.chavesnamao.com.br${href}`;

                    // Extract ID from URL slug
                    const idMatch = href.match(/id-(\d+)/);
                    if (!idMatch) return;
                    const id = `chaves-${idMatch[1]}`;
                    if (existingIds.has(id)) return;

                    // Get the card text
                    const cardText = $el.text();
                    const parentText = $el.parent().text();

                    // Extract price - look for the main price (not condomínio)
                    const price = extractPrice(cardText);
                    if (price <= 0 || price > 1000) return;

                    // Extract condomínio
                    const condMatch = parentText.match(/Condomínio\s*R\$\s*([\d.]+)/i);
                    const condominio = condMatch ? parseInt(condMatch[1].replace(/\./g, ''), 10) : 0;

                    // Extract title from the link or nearby heading
                    const title = $el.find('h2, h3, [class*="title"]').first().text().trim()
                        || $el.attr('title')
                        || cardText.substring(0, 80).trim();

                    // Extract location
                    const locationMatch = cardText.match(/([\w\s]+),\s*Rio de Janeiro\/RJ/i)
                        || cardText.match(/([\w\s]+),\s*[\w\s]+\/RJ/i);
                    const neighborhood = locationMatch ? locationMatch[1].trim() : '';
                    const location = neighborhood ? `${neighborhood}, Rio de Janeiro` : 'Rio de Janeiro';

                    // Extract area
                    const areaMatch = cardText.match(/(\d+)\s*m²/);
                    const area = areaMatch ? parseInt(areaMatch[1], 10) : 0;

                    // Extract rooms
                    const rooms = extractNumber(cardText, /(\d+)\s*(?:quarto|dorm)/i);

                    // Extract bathrooms
                    const bathrooms = extractNumber(cardText, /(\d+)\s*(?:banheiro|suíte)/i);

                    // Extract image
                    const img = $el.find('img').first();
                    const image = img.attr('data-src') || img.attr('src') || '';

                    const zone = classifyZone(location + ' ' + neighborhood);

                    const property: Property = {
                        id,
                        title: title || `Imóvel em ${neighborhood || 'Rio de Janeiro'}`,
                        price,
                        condominio,
                        url: fullUrl,
                        image,
                        rooms,
                        bathrooms,
                        area,
                        location,
                        neighborhood,
                        zone,
                        description: '',
                        source: 'chavesnamao',
                        directOwner: false,
                        found_at: new Date().toISOString(),
                    };

                    properties.push(property);
                    existingIds.add(id);
                    pageNew++;
                } catch (e) {
                    // Skip individual card errors
                }
            });

            console.log(`   ✅ +${pageNew} new properties from page ${page}.`);
            totalNew += pageNew;

            // Be polite - wait between pages
            if (page < MAX_PAGES) {
                await new Promise(r => setTimeout(r, 1500));
            }

        } catch (e: any) {
            console.log(`   ❌ Page ${page} error: ${e.message}`);
        }
    }

    // Save
    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2), 'utf-8');
    console.log(`\n🏁 Finished Chaves na Mão. Added ${totalNew} new. Total: ${properties.length}\n`);
}

scrapeChavesNaMao();
