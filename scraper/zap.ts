import { supabase } from '../src/lib/supabase';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { saveProperties } from './saveProperties';
import { isCommercial, isForSale } from '../src/utils/normalize';
import type { Property } from './index';

chromium.use(stealth());

const MAX_PAGES = 30;

function classifyZone(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('niterói') || lower.includes('niteroi')) return 'Niterói';
    if (lower.includes('são gonçalo') || lower.includes('sao-goncalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('são joão de meriti') || lower.includes('itaguaí')) return 'Baixada';
    if (lower.includes('maricá') || lower.includes('marica')) return 'Maricá';
    if (lower.includes('teresópolis') || lower.includes('petrópolis')) return 'Serrana';
    if (lower.includes('mangaratiba') || lower.includes('angra')) return 'Costa Verde';

    if (lower.includes('zona-oeste') || lower.includes('zona oeste') || lower.includes('barra da tijuca') || lower.includes('recreio') || lower.includes('jacarepaguá')) return 'Zona Oeste';
    if (lower.includes('zona-norte') || lower.includes('zona norte') || lower.includes('tijuca') || lower.includes('méier') || lower.includes('madureira')) return 'Zona Norte';
    if (lower.includes('zona-sul') || lower.includes('zona sul') || lower.includes('copacabana') || lower.includes('ipanema') || lower.includes('leblon') || lower.includes('botafogo')) return 'Zona Sul';
    if (lower.includes('zona-central') || lower.includes('centro') || lower.includes('lapa')) return 'Centro';
    
    return 'Geral';
}

function parseCard(card: { href: string; text: string; image: string }, source: string): Partial<Property> | null {
    const idMatch = card.href.match(/id-(\d+)/);
    if (!idMatch) return null;
    const id = `${source}_${idMatch[1]}`;

    // Price
    const priceMatch = card.text.match(/R\$\s*([\d.]+)/i);
    if (!priceMatch) return null;
    const price = parseFloat(priceMatch[1].replace(/\./g, ''));
    if (price <= 0 || price > 1000) return null;

    // Condo
    const condoMatch = card.text.match(/Cond\.\s*R\$\s*([\d.]+)/i);
    const condominio = condoMatch ? parseFloat(condoMatch[1].replace(/\./g, '')) : 0;

    // Area
    const areaMatch = card.text.match(/(\d+)\s*m²/);
    const area = areaMatch ? parseInt(areaMatch[1]) : 0;

    // Title / Type
    const typeMatch = card.text.match(/(Apartamento|Casa|Kitnet|Sobrado|Sala|Conjunto|Studio|Loft|Flat|Quitinete|Ponto comercial|Galpão|Prédio)[^\n]*/i);
    const title = typeMatch ? typeMatch[0].substring(0, 80).trim() : `Imóvel em ${idMatch[1]}`;

    // Rooms
    const roomsQty = card.text.match(/Quantidade de quartos\s*(\d+)/i);
    const roomsAlt = card.text.match(/(\d+)\s*quartos?/i);
    let rooms = roomsQty ? parseInt(roomsQty[1]) : roomsAlt ? parseInt(roomsAlt[1]) : 0;
    if (rooms === 0 && /(kitnet|quitinete|studio|loft|flat|conjugado)/i.test(title)) {
        rooms = 0;
    } else if (rooms === 0) {
        rooms = 1;
    }

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
        source,
        found_at: new Date().toISOString()
    };
}

async function scrapeSource() {
    const siteName = 'ZAP Imóveis';
    console.log(`\n🔍 Iniciando Deep Scraper (v2) para ${siteName}...`);
    
    const { data: existingData } = await supabase.from('properties').select('id').eq('source', 'zap');
    const existingIds = new Set(existingData?.map(p => p.id) || []);
    console.log(`🗄️ Base atual tem ${existingIds.size} imóveis da ${siteName} salvos.`);
    
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    console.log(`\n📡 Fase 1: Discovery (Buscando novos cards no ${siteName})...`);
    const discoveredCards = new Map<string, Partial<Property>>();

    for (let pg = 1; pg <= MAX_PAGES; pg++) {
        try {
            const baseUrl = `https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel&pagina=${pg}`;
            process.stdout.write(`   Pesquisando Vitrine [${pg}/${MAX_PAGES}]...\r`);
            await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Auto-scroll robusto para lazy loading
            let previousHeight = 0;
            for (let i = 0; i < 15; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(600);
                const currentHeight = await page.evaluate(() => document.body.scrollHeight);
                if (currentHeight === previousHeight) break;
                previousHeight = currentHeight;
            }

            const cards = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="/imovel/"]'));
                return links.map(link => {
                    let card: HTMLElement | null = link as HTMLElement;
                    for (let i = 0; i < 10; i++) {
                        if (card?.parentElement) card = card.parentElement;
                        if (card?.tagName === 'LI' || card?.tagName === 'DIV' && card.className.includes('card')) break;
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

            if (cards.length === 0) {
                console.log(`\n   ⏹️ Sem resultados na página ${pg}. Parando vitrine.`);
                break;
            }

            for (const card of cards) {
                const parsed = parseCard(card, 'zap');
                if (parsed && !existingIds.has(parsed.id!)) {
                    discoveredCards.set(parsed.id!, parsed);
                }
            }
        } catch (e: any) {
            console.log(`\n   ❌ Erro na vitrine ${pg}: ${e.message}`);
        }
    }

    console.log(`\n   ✅ Fase 1 finalizada. Iniciando análise profunda... ${discoveredCards.size} anúncios INÉDITOS para Deep Scraping.`);

    const newPropertiesForSupabase: Property[] = [];
    let processed = 0;
    const cardsToScrape = Array.from(discoveredCards.values());

    for (const partialProp of cardsToScrape) {
        processed++;
        try {
            process.stdout.write(`   ⬇️ [${processed}/${cardsToScrape.length}] Entrando no anúncio...\r`);
            await page.goto(partialProp.url!, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(2000);

            const { description, images } = await page.evaluate(() => {
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

                // Extrair imagens da galeria (ZAP geralmente usa swiper-slide ou figure)
                const imgEls = Array.from(document.querySelectorAll('.carousel__image, .swiper-slide img, img[alt*="Foto"]'));
                const images: string[] = [];
                for (const img of imgEls) {
                    const src = img.getAttribute('src') || img.getAttribute('data-src');
                    // Ignorar gifs de loading, svgs, ou imagens de avatar
                    if (src && !src.includes('.svg') && !src.includes('data:image') && !images.includes(src)) {
                        images.push(src);
                        if (images.length >= 10) break;
                    }
                }

                return { description, images };
            });

            const finalDescription = description || partialProp.title || '';
            const descLower = finalDescription.toLowerCase();

            if (isForSale(partialProp.title!, finalDescription)) continue;
            if (isCommercial(partialProp.title!, finalDescription)) continue;

            const directOwner = descLower.includes('direto com o proprietário') || descLower.includes('direto com proprietario');

            const property: Property = {
                id: partialProp.id!,
                title: partialProp.title!,
                price: partialProp.price!,
                condominio: partialProp.condominio || 0,
                url: partialProp.url!,
                image: images.length > 0 ? images[0] : (partialProp.image || ''),
                images: images,
                rooms: partialProp.rooms || 0,
                bathrooms: partialProp.bathrooms || 1,
                area: partialProp.area || 0,
                location: partialProp.location!,
                neighborhood: partialProp.neighborhood!,
                zone: partialProp.zone!,
                description: finalDescription.substring(0, 500),
                source: 'zap',
                directOwner,
                found_at: partialProp.found_at!
            };

            newPropertiesForSupabase.push(property);
            existingIds.add(property.id);

        } catch (e: any) { }
    }

    if (newPropertiesForSupabase.length > 0) {
        await saveProperties(newPropertiesForSupabase, siteName);
    }

    console.log(`\n🏁 Concluído! O Deep Scraper ZAP injetou ${newPropertiesForSupabase.length} anúncios purificados no banco.`);
    await browser.close();
}

(async () => {
    await scrapeSource();
})().catch(console.error);
