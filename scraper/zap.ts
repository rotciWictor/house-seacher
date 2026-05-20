import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import type { Property } from './index';

chromium.use(stealth());

const dataPath = path.resolve('src/data/properties.json');
const MAX_PAGES = 5;

function classifyZone(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('zona-oeste') || lower.includes('zona oeste')) return 'Oeste';
    if (lower.includes('zona-norte') || lower.includes('zona norte')) return 'Norte';
    if (lower.includes('zona-sul') || lower.includes('zona sul')) return 'Sul';
    if (lower.includes('zona-central') || lower.includes('centro')) return 'Centro';
    if (lower.includes('niterói') || lower.includes('niteroi')) return 'Niterói';
    if (lower.includes('são gonçalo') || lower.includes('sao-goncalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('são joão de meriti') || lower.includes('itaguaí')) return 'Baixada';
    if (lower.includes('maricá') || lower.includes('marica')) return 'Maricá';
    if (lower.includes('teresópolis') || lower.includes('petrópolis')) return 'Serrana';
    if (lower.includes('mangaratiba') || lower.includes('angra')) return 'Costa Verde';
    return 'Geral';
}

function parseCard(card: { href: string; text: string; image: string }, source: string, existingIds: Set<string>): Property | null {
    const idMatch = card.href.match(/id-(\d+)/);
    if (!idMatch) return null;
    const id = `${source}_${idMatch[1]}`;
    if (existingIds.has(id)) return null;

    // Price
    const priceMatch = card.text.match(/R\$\s*([\d.]+)\s*\/mês/i);
    if (!priceMatch) return null;
    const price = parseFloat(priceMatch[1].replace('.', ''));
    if (price <= 0 || price > 1000) return null;

    // Condo
    const condoMatch = card.text.match(/Cond\.\s*R\$\s*([\d.]+)/i);
    const condominio = condoMatch ? parseFloat(condoMatch[1].replace('.', '')) : 0;

    // Area
    const areaMatch = card.text.match(/(\d+)\s*m²/);
    const area = areaMatch ? parseInt(areaMatch[1]) : 0;

    // Rooms
    const roomsQty = card.text.match(/Quantidade de quartos\s*(\d+)/i);
    const roomsAlt = card.text.match(/(\d+)\s*quartos?/i);
    const rooms = roomsQty ? parseInt(roomsQty[1]) : roomsAlt ? parseInt(roomsAlt[1]) : 0;

    // Bathrooms
    const bathQty = card.text.match(/Quantidade de banheiros\s*(\d+)/i);
    const bathrooms = bathQty ? parseInt(bathQty[1]) : 1;

    // Location
    const locMatch = card.text.match(/(?:em|emm)\s*([^,\n]+),\s*([^\n]+?)(?:Rua|Av\.|Estr|Tamanho|Travessa|Praça|Alameda|Beco)/i);
    let neighborhood = 'Desconhecido';
    let city = 'Rio de Janeiro';
    if (locMatch) {
        neighborhood = locMatch[1].trim();
        city = locMatch[2].trim();
    }

    const zone = classifyZone(card.href + ' ' + city + ' ' + neighborhood);

    // Title
    const typeMatch = card.text.match(/(Apartamento|Casa|Kitnet|Sobrado|Sala|Conjunto|Studio|Loft|Flat|Quitinete|Ponto comercial|Galpão|Prédio)[^\n]*/i);
    const title = typeMatch ? typeMatch[0].substring(0, 80).trim() : `Imóvel em ${neighborhood}`;

    return {
        id,
        title,
        price,
        condominio,
        url: card.href.split('?')[0],
        image: card.image,
        rooms,
        bathrooms,
        area,
        location: `${city}, ${neighborhood}`,
        neighborhood,
        zone,
        description: card.text.substring(0, 300),
        source,
        directOwner: false,
        found_at: new Date().toISOString()
    };
}

async function scrapeSource(source: 'zap' | 'vivareal') {
    const siteName = source === 'zap' ? 'ZAP Imóveis' : 'VivaReal';
    console.log(`\n🔍 Starting ${siteName} scraper (${MAX_PAGES} pages)...`);
    
    let properties: Property[] = [];
    try {
        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath, 'utf-8');
            if (rawData.trim() !== '') properties = JSON.parse(rawData);
        }
    } catch (e) {
        console.error('Could not read existing data.', e);
    }

    const existingIds = new Set(properties.map(p => p.id));
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'pt-BR',
    });

    const page = await context.newPage();
    let totalNew = 0;

    for (let pg = 1; pg <= MAX_PAGES; pg++) {
        try {
            const pageParam = source === 'zap' ? `&pagina=${pg}` : `&pagina=${pg}`;
            const baseUrl = source === 'zap'
                ? `https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel${pageParam}`
                : `https://www.vivareal.com.br/aluguel/rj/rio-de-janeiro/?precoMaximo=1000${pageParam}`;

            console.log(`\n   📄 Page ${pg}/${MAX_PAGES}: ${baseUrl.substring(0, 80)}...`);
            await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
            await page.waitForTimeout(4000);

            // Scroll to load lazy content
            for (let i = 0; i < 5; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(600);
            }

            // Extract cards
            const cards = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="/imovel/"]'));
                return links.map(link => {
                    let card: HTMLElement | null = link as HTMLElement;
                    for (let i = 0; i < 10; i++) {
                        if (card?.parentElement) card = card.parentElement;
                        if (card?.tagName === 'LI') break;
                    }
                    const text = card?.textContent || '';
                    const href = (link as HTMLAnchorElement).href;
                    const imgs = Array.from(card?.querySelectorAll('img') || []);
                    const imgSrc = imgs
                        .map(i => i.src || i.getAttribute('data-src') || '')
                        .find(s => s && !s.includes('data:image') && !s.includes('svg')) || '';
                    return { href, text, image: imgSrc };
                });
            });

            console.log(`   Found ${cards.length} cards.`);
            let pageNew = 0;

            for (const card of cards) {
                const property = parseCard(card, source, existingIds);
                if (property) {
                    properties.push(property);
                    existingIds.add(property.id);
                    pageNew++;
                    totalNew++;
                }
            }

            console.log(`   ✅ +${pageNew} new properties from page ${pg}.`);

            // If no new cards, stop paginating
            if (pageNew === 0 && cards.length === 0) {
                console.log(`   ⏹️ No more results. Stopping.`);
                break;
            }

        } catch (e: any) {
            console.log(`   ❌ Page ${pg} error: ${e.message}`);
        }
    }

    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2));
    console.log(`\n🏁 Finished ${siteName}. Added ${totalNew} new. Total: ${properties.length}`);
    await browser.close();
}

(async () => {
    await scrapeSource('zap');
    await scrapeSource('vivareal');
})().catch(console.error);
