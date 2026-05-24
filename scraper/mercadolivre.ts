import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { supabase } from '../src/lib/supabase';
import type { Property } from './index';
import { saveProperties } from './saveProperties';
import { isCommercial, isForSale } from '../src/utils/normalize';

chromium.use(stealth());

const MAX_PAGES = 30;
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

async function scrapeML() {
    console.log(`\n🔍 Iniciando Deep Scraper (v2) para Mercado Livre...`);

    const { data: existingData } = await supabase.from('properties').select('id').eq('source', 'mercadolivre');
    const existingIds = new Set(existingData?.map(p => p.id) || []);
    console.log(`🗄️ Base atual tem ${existingIds.size} imóveis do Mercado Livre salvos.`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let currentUrl = BASE_URL;

    // ========================================
    // FASE 1: DISCOVERY (Crawling Superficial)
    // ========================================
    console.log(`\n📡 Fase 1: Discovery (Buscando novos anúncios no Mercado Livre)...`);
    const discoveredCards = new Map<string, Partial<Property>>();

    for (let p = 1; p <= MAX_PAGES; p++) {
        process.stdout.write(`   Pesquisando Vitrine [${p}/${MAX_PAGES}]...\r`);

        try {
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForSelector('.ui-search-layout__item', { timeout: 10000 }).catch(() => {});

            // Auto-scroll robusto para lazy loading
            let previousHeight = 0;
            for (let i = 0; i < 10; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(500);
                const currentHeight = await page.evaluate(() => document.body.scrollHeight);
                if (currentHeight === previousHeight) break;
                previousHeight = currentHeight;
            }

            const cards = await page.$$('.ui-search-layout__item');
            if (cards.length === 0) {
                 console.log(`\n   ⏹️ Sem resultados na página ${p}. Parando vitrine.`);
                 break;
            }

            for (const card of cards) {
                try {
                    const linkEl = await card.$('a.poly-component__title');
                    if (!linkEl) continue;
                    
                    const url = await linkEl.getAttribute('href') || '';
                    if (!url || !url.includes('imovel.mercadolivre.com.br')) continue;

                    const idMatch = url.match(/MLB-?(\d+)/i);
                    if (!idMatch) continue;
                    const id = `ml-${idMatch[1]}`;
                    
                    if (existingIds.has(id)) continue;

                    const titleEl = await card.$('.poly-component__title');
                    const title = titleEl ? await titleEl.innerText() : 'Imóvel ML';

                    const priceEl = await card.$('.andes-money-amount__fraction');
                    const priceText = priceEl ? await priceEl.innerText() : '0';
                    const price = parseInt(priceText.replace(/\./g, ''), 10);
                    if (price <= 0 || price > 1000) continue;

                    const attrEls = await card.$$('.poly-attributes_list__item');
                    let area = 0;
                    let rooms = 0;
                    for (const attr of attrEls) {
                        const text = await attr.innerText();
                        if (text.includes('m²')) area = parseInt(text.replace(/[^\d]/g, ''), 10);
                        if (text.includes('quarto')) rooms = parseInt(text.replace(/[^\d]/g, ''), 10);
                    }
                    if (rooms === 0 && /(kitnet|quitinete|studio|loft|flat|conjugado)/i.test(title)) {
                        rooms = 0;
                    } else if (rooms === 0) {
                        rooms = 1;
                    }

                    const locEl = await card.$('.poly-component__location');
                    const location = locEl ? await locEl.innerText() : 'Rio de Janeiro';
                    const zone = classifyZone(location);

                    const imgEl = await card.$('img.poly-component__picture');
                    const image = imgEl ? (await imgEl.getAttribute('src') || await imgEl.getAttribute('data-src') || '') : '';

                    discoveredCards.set(id, {
                        id, title, price, condominio: 0, url: url.split('#')[0],
                        image, rooms, bathrooms: 1, area, location, neighborhood: location, zone,
                        source: 'mercadolivre', found_at: new Date().toISOString()
                    });
                } catch (e) { }
            }

            const nextBtn = await page.$('a.andes-pagination__link[title="Seguinte"]');
            if (nextBtn) {
                const nextUrl = await nextBtn.getAttribute('href');
                if (nextUrl) {
                    currentUrl = nextUrl;
                    await page.waitForTimeout(2000);
                } else break;
            } else break;

        } catch (e: any) {
            console.log(`\n   ❌ Erro na vitrine ${p}: ${e.message}`);
            break;
        }
    }

    console.log(`\n   ✅ Fase 1 finalizada. Iniciando análise profunda... ${discoveredCards.size} anúncios INÉDITOS para Deep Scraping.`);

    // ========================================
    // FASE 2: DEEP SCRAPING
    // ========================================
    const newPropertiesForSupabase: Property[] = [];
    let processed = 0;
    const cardsToScrape = Array.from(discoveredCards.values());

    for (const partialProp of cardsToScrape) {
        processed++;
        try {
            process.stdout.write(`   ⬇️ [${processed}/${cardsToScrape.length}] Entrando no anúncio...\r`);
            await page.goto(partialProp.url!, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(2000);

            const descData = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                let description = '';
                for (const s of scripts) {
                    try {
                        const j = JSON.parse(s.textContent || '{}');
                        if (j['@type'] === 'Product' || j['@type'] === 'Apartment' || j['@type'] === 'House' || j.description) {
                            description = j.description || description;
                        }
                    } catch (e) {}
                }
                if (!description) {
                    const descEl = document.querySelector('.ui-pdp-description__content');
                    if (descEl) description = descEl.textContent || '';
                }
                return description;
            });

            const description = descData || partialProp.title || '';
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

    if (newPropertiesForSupabase.length > 0) {
        await saveProperties(newPropertiesForSupabase, 'Mercado Livre');
    }

    console.log(`\n🏁 Concluído! O Deep Scraper ML injetou ${newPropertiesForSupabase.length} anúncios purificados no banco.`);
    await browser.close();
}

scrapeML().catch(console.error);
