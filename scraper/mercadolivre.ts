import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import type { Property } from './index';
import { saveProperties } from './saveProperties';

chromium.use(stealth());

const dataPath = path.resolve('src/data/properties.json');
const MAX_PAGES = 15;
const BASE_URL = 'https://lista.mercadolivre.com.br/imoveis/aluguel/rio-de-janeiro/rio-de-janeiro/_PriceRange_0-1000_NoIndex_True';

function classifyZone(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('niterói') || lower.includes('niteroi')) return 'Niterói';
    if (lower.includes('são gonçalo') || lower.includes('sao goncalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('são joão de meriti')) return 'Baixada';

    const oeste = ['campo grande','santa cruz','bangu','realengo','padre miguel','senador camará','cosmos','inhoaíba','paciência','sepetiba','guaratiba','vargem grande','vargem pequena','recreio','barra da tijuca','jacarepaguá','taquara','tanque','pechincha','anil','curicica','freguesia','praça seca','vila valqueire','deodoro','santíssimo','barra olímpica'];
    const norte = ['méier','madureira','cascadura','quintino','piedade','pilares','engenho de dentro','engenho novo','todos os santos','cachambi','tijuca','andaraí','grajaú','maracanã','vila isabel','irajá','vicente de carvalho','vila da penha','penha','penha circular','olaria','ramos','bonsucesso','são cristóvão','ilha do governador','parada de lucas','vigário geral','cordovil','brás de pina','marechal hermes','bento ribeiro','osvaldo cruz','guadalupe','costa barros','pavuna','anchieta','ricardo de albuquerque','cavalcanti','rocha miranda','lins de vasconcelos','campinho','del castilho','inhaúma','centro','estácio','rio comprido','santa teresa','lapa','glória'];
    const sul = ['copacabana','ipanema','leblon','botafogo','flamengo','laranjeiras','cosme velho','humaitá','urca','leme','gávea','jardim botânico','lagoa','são conrado','catete'];

    for (const b of oeste) if (lower.includes(b)) return 'Zona Oeste';
    for (const b of norte) if (lower.includes(b)) return 'Zona Norte';
    for (const b of sul) if (lower.includes(b)) return 'Zona Sul';
    return 'Geral';
}

function extractNumber(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    return match ? parseInt(match[1].replace(/[^\d]/g, ''), 10) : 0;
}

async function scrapeML() {
    console.log(`🔍 Starting Mercado Livre scraper (${MAX_PAGES} pages)...\\n`);

    let properties: Property[] = [];
    const newPropertiesForSupabase: Property[] = [];
    try {
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf-8');
            if (raw.trim()) properties = JSON.parse(raw);
        }
    } catch (e) {
        console.error('Could not read existing data, starting fresh.', e);
    }

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    properties = properties.filter(p => p.source !== 'mercadolivre' || p.found_at > threeDaysAgo);
    const existingIds = new Set(properties.map(p => p.id));
    let totalNew = 0;

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let currentUrl = BASE_URL;

    for (let p = 1; p <= MAX_PAGES; p++) {
        console.log(`   📄 Page ${p}/${MAX_PAGES}: ${currentUrl}`);

        try {
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Wait for cards to appear
            await page.waitForSelector('.ui-search-layout__item', { timeout: 10000 }).catch(() => {});

            const cards = await page.$$('.ui-search-layout__item');
            console.log(`   Found ${cards.length} cards.`);
            
            if (cards.length === 0) break;

            let pageNew = 0;

            for (const card of cards) {
                try {
                    const linkEl = await card.$('.ui-search-link');
                    if (!linkEl) continue;
                    
                    const url = await linkEl.getAttribute('href') || '';
                    if (!url) continue;

                    // ML ids are like MLB1234567. We can extract from URL.
                    const idMatch = url.match(/MLB-?(\d+)/i);
                    if (!idMatch) continue;
                    const id = `ml-${idMatch[1]}`;
                    
                    if (existingIds.has(id)) continue;

                    // Title
                    const titleEl = await card.$('.ui-search-item__title');
                    const title = titleEl ? await titleEl.innerText() : 'Imóvel no Mercado Livre';

                    // Price
                    const priceEl = await card.$('.andes-money-amount__fraction');
                    const priceText = priceEl ? await priceEl.innerText() : '0';
                    const price = parseInt(priceText.replace(/\\./g, ''), 10);
                    
                    if (price <= 0 || price > 1000) continue;

                    // Attributes (m², quartos)
                    const attrEls = await card.$$('.ui-search-item__attributes li');
                    let area = 0;
                    let rooms = 0;
                    for (const attr of attrEls) {
                        const text = await attr.innerText();
                        if (text.includes('m²')) area = parseInt(text.replace(/[^\d]/g, ''), 10);
                        if (text.includes('quarto')) rooms = parseInt(text.replace(/[^\d]/g, ''), 10);
                    }

                    // Location
                    const locEl = await card.$('.ui-search-item__location');
                    const location = locEl ? await locEl.innerText() : 'Rio de Janeiro';
                    const neighborhood = location.split(',')[0].trim();
                    const zone = classifyZone(location);

                    // Image
                    const imgEl = await card.$('img.ui-search-result-image__image');
                    const image = imgEl ? (await imgEl.getAttribute('src') || await imgEl.getAttribute('data-src') || '') : '';

                    const property: Property = {
                        id,
                        title,
                        price,
                        condominio: 0,
                        url: url.split('#')[0],
                        image,
                        rooms,
                        bathrooms: 0,
                        area,
                        location,
                        neighborhood,
                        zone,
                        description: '',
                        source: 'mercadolivre',
                        directOwner: false,
                        found_at: new Date().toISOString()
                    };
                    properties.push(property);
                    newPropertiesForSupabase.push(property);
                    
                    existingIds.add(id);
                    pageNew++;
                } catch (e) {
                    // skip card
                }
            }
            
            console.log(`   ✅ +${pageNew} new properties from page ${p}.`);
            totalNew += pageNew;

            // Pagination
            const nextBtn = await page.$('a.andes-pagination__link.ui-search-link[title="Seguinte"]');
            if (nextBtn) {
                const nextUrl = await nextBtn.getAttribute('href');
                if (nextUrl) {
                    currentUrl = nextUrl;
                    await page.waitForTimeout(2000);
                } else {
                    break;
                }
            } else {
                break;
            }

        } catch (e: any) {
            console.log(`   ❌ Page error: ${e.message}`);
            break;
        }
    }

    await browser.close();
    
    await saveProperties(newPropertiesForSupabase, 'Mercado Livre');
    console.log(`\\n🏁 Finished Mercado Livre. Added ${totalNew} new. Total: ${properties.length}\\n`);
}

scrapeML();
