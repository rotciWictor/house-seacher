import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { supabase } from '../src/lib/supabase';

import type { Property } from './index';
import { saveProperties } from './saveProperties';
import { isCommercial, isForSale } from '../src/utils/normalize';

chromium.use(stealth());

const MAX_PAGES = 10;
const BASE_URL = 'https://www.chavesnamao.com.br/imoveis-para-alugar/rj-rio-de-janeiro/?valormax=1000';

function classifyZone(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('niterói') || lower.includes('niteroi')) return 'Niterói';
    if (lower.includes('são gonçalo') || lower.includes('sao goncalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('são joão de meriti')) return 'Baixada';

    const oeste = ['campo grande','santa cruz','bangu','realengo','padre miguel','senador camará','cosmos','inhoaíba','paciência','sepetiba','guaratiba','vargem grande','vargem pequena','recreio','barra da tijuca','jacarepaguá','taquara','tanque','pechincha','anil','curicica','freguesia','praça seca','vila valqueire','deodoro','santíssimo','barra olímpica','rio das pedras'];
    const norte = ['méier','madureira','cascadura','quintino','piedade','pilares','engenho de dentro','engenho novo','todos os santos','cachambi','tijuca','andaraí','grajaú','maracanã','vila isabel','irajá','vicente de carvalho','vila da penha','penha','penha circular','olaria','ramos','bonsucesso','são cristóvão','ilha do governador','parada de lucas','vigário geral','cordovil','brás de pina','marechal hermes','bento ribeiro','osvaldo cruz','guadalupe','costa barros','pavuna','anchieta','ricardo de albuquerque','cavalcanti','rocha miranda','lins de vasconcelos','campinho','del castilho','inhaúma','centro','estácio','rio comprido','santa teresa','lapa','glória'];
    const sul = ['copacabana','ipanema','leblon','botafogo','flamengo','laranjeiras','cosme velho','humaitá','urca','leme','gávea','jardim botânico','lagoa','são conrado','catete'];

    for (const b of oeste) if (lower.includes(b)) return 'Zona Oeste';
    for (const b of norte) if (lower.includes(b)) return 'Zona Norte';
    for (const b of sul) if (lower.includes(b)) return 'Zona Sul';
    return 'Geral';
}

function extractPrice(text: string): number {
    const match = text.match(/R\$\s*([\d.]+)/);
    if (!match) return 0;
    return parseInt(match[1].replace(/\./g, ''), 10);
}

function extractNumber(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    return match ? parseInt(match[1], 10) : 0;
}

async function scrapeChavesNaMao() {
    console.log(`\n🔍 Iniciando Deep Scraper (v2) para Chaves na Mão...`);

    const { data: existingData } = await supabase.from('properties').select('id').eq('source', 'chavesnamao');
    const existingIds = new Set(existingData?.map(p => p.id) || []);
    console.log(`🗄️ Base atual tem ${existingIds.size} imóveis do Chaves na Mão salvos.`);

    // ========================================
    // FASE 1: DISCOVERY (Crawling Superficial via fetch)
    // ========================================
    console.log(`\n📡 Fase 1: Discovery (Buscando novos anúncios via Fetch)...`);
    const discoveredCards = new Map<string, Partial<Property>>();

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    for (let pg = 1; pg <= MAX_PAGES; pg++) {
        process.stdout.write(`   Pesquisando Vitrine [${pg}/${MAX_PAGES}]...\r`);
        const pageUrl = pg === 1 ? BASE_URL : `${BASE_URL}&pagina=${pg}`;

        try {
            await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            let previousHeight = 0;
            for (let i = 0; i < 15; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(600);
                const currentHeight = await page.evaluate(() => document.body.scrollHeight);
                if (currentHeight === previousHeight) break;
                previousHeight = currentHeight;
            }

            const links = await page.$$('a[href*="/imovel/"]');
            
            if (links.length === 0) {
                 console.log(`\n   ⏹️ Sem resultados na página ${pg}. Parando vitrine.`);
                 break;
            }

            const cardsData = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a[href*="/imovel/"]'));
                return anchors.map(a => {
                    const href = (a as HTMLAnchorElement).href;
                    let parent = a.parentElement;
                    for (let i = 0; i < 5; i++) {
                        if (!parent) break;
                        if (parent.textContent?.includes('R$') && parent.textContent?.includes('m²')) break;
                        parent = parent.parentElement;
                    }
                    const text = parent ? parent.textContent || '' : a.textContent || '';
                    const imgs = Array.from(parent ? parent.querySelectorAll('img') : a.querySelectorAll('img'));
                    const image = imgs.map(img => img.src || img.getAttribute('data-src') || '').find(s => s && !s.includes('data:image')) || '';
                    return { href, text, image };
                });
            });

            for (const card of cardsData) {
                try {
                    const href = card.href;
                    const fullUrl = href.startsWith('http') ? href : `https://www.chavesnamao.com.br${href}`;

                    const idMatch = href.match(/id-(\d+)/);
                    if (!idMatch) continue;
                    const id = `chaves-${idMatch[1]}`;
                    
                    if (existingIds.has(id)) continue;

                    const cardText = card.text;

                    const price = extractPrice(cardText);
                    if (price <= 0 || price > 1000) continue;

                    const condMatch = cardText.match(/Condomínio\s*R\$\s*([\d.]+)/i);
                    const condominio = condMatch ? parseInt(condMatch[1].replace(/\./g, ''), 10) : 0;

                    const titleMatch = cardText.match(/(Apartamento|Casa|Kitnet|Sobrado|Sala|Conjunto|Studio|Loft|Flat|Quitinete)[^\n]*/i);
                    const title = titleMatch ? titleMatch[0].substring(0, 80).trim() : cardText.substring(0, 80).trim();

                    const locationMatch = cardText.match(/([\w\s]+),\s*Rio de Janeiro\/RJ/i) || cardText.match(/([\w\s]+),\s*[\w\s]+\/RJ/i);
                    const neighborhood = locationMatch ? locationMatch[1].trim() : '';
                    const location = neighborhood ? `${neighborhood}, Rio de Janeiro` : 'Rio de Janeiro';

                    const areaMatch = cardText.match(/(\d+)\s*m²/);
                    const area = areaMatch ? parseInt(areaMatch[1], 10) : 0;
                    
                    let rooms = extractNumber(cardText, /(\d+)\s*(?:quarto|dorm)/i);
                    if (rooms === 0 && /(kitnet|quitinete|studio|loft|flat|conjugado)/i.test(title)) rooms = 0;
                    else if (rooms === 0) rooms = 1;

                    const bathrooms = extractNumber(cardText, /(\d+)\s*(?:banheiro|suíte)/i);

                    const zone = classifyZone(location + ' ' + neighborhood);

                    discoveredCards.set(id, {
                        id, title: title || `Imóvel em ${neighborhood || 'Rio de Janeiro'}`, price, condominio, url: fullUrl,
                        image: card.image, rooms, bathrooms, area, location, neighborhood, zone,
                        source: 'chavesnamao', found_at: new Date().toISOString()
                    });
                } catch (e) {}
            }
        } catch (e: any) {
            console.log(`\n   ❌ Erro na vitrine ${pg}: ${e.message}`);
            break;
        }
    }

    console.log(`\n   ✅ Discovery concluído. ${discoveredCards.size} anúncios INÉDITOS para Deep Scraping.`);

    // ========================================
    // FASE 2: DEEP SCRAPING (Via Playwright)
    // ========================================
    const newPropertiesForSupabase: Property[] = [];
    let processed = 0;
    const cardsToScrape = Array.from(discoveredCards.values());

    if (cardsToScrape.length > 0) {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        for (const partialProp of cardsToScrape) {
            processed++;
            try {
                process.stdout.write(`   ⬇️ [${processed}/${cardsToScrape.length}] Entrando no anúncio...\r`);
                await page.goto(partialProp.url!, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.waitForTimeout(2000);

                const description = await page.evaluate(() => {
                    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                    let desc = '';
                    for (const s of scripts) {
                        try {
                            const j = JSON.parse(s.textContent || '{}');
                            if (j.description) desc = j.description;
                        } catch (e) {}
                    }
                    if (!desc) {
                        // fallback to body text
                        desc = document.body.innerText;
                    }
                    return desc;
                });

                const descLower = description.toLowerCase();

                // 🛡️ DEEP FILTERING
                if (isForSale(partialProp.title!, description)) {
                    console.log(`   🚫 Bloqueado: Semântica de venda na descrição profunda. (${partialProp.url})`);
                    continue;
                }

                if (isCommercial(partialProp.title!, description)) {
                    console.log(`   🚫 Bloqueado: Uso comercial detectado na descrição profunda. (${partialProp.url})`);
                    continue;
                }

                const directOwner = descLower.includes('direto com o proprietário') || descLower.includes('direto com proprietario');

                const property: Property = {
                    id: partialProp.id!,
                    title: partialProp.title!,
                    price: partialProp.price!,
                    condominio: partialProp.condominio || 0,
                    url: partialProp.url!,
                    image: partialProp.image || '',
                    rooms: partialProp.rooms || 0,
                    bathrooms: partialProp.bathrooms || 1,
                    area: partialProp.area || 0,
                    location: partialProp.location!,
                    neighborhood: partialProp.neighborhood!,
                    zone: partialProp.zone!,
                    description: description.substring(0, 500),
                    source: partialProp.source!,
                    directOwner,
                    found_at: partialProp.found_at!
                };

                newPropertiesForSupabase.push(property);
                existingIds.add(property.id);
                console.log(`   ✅ Deep Scraped: ${property.title.substring(0, 40)} (R$ ${property.price})`);

            } catch (e: any) {
                 console.log(`   ❌ Erro durante o deep scrape do anúncio: ${e.message}`);
            }
        }
        await browser.close();
    }

    if (newPropertiesForSupabase.length > 0) {
        await saveProperties(newPropertiesForSupabase, 'Chaves na Mão');
    }

    console.log(`\n🏁 Concluído! O Deep Scraper injetou ${newPropertiesForSupabase.length} anúncios purificados no banco.`);
}

scrapeChavesNaMao().catch(console.error);
