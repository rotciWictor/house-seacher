import * as cheerio from 'cheerio';
import { supabase } from '../src/lib/supabase';
import type { Property } from './index';
import { saveProperties } from './saveProperties';
import { isCommercial, isForSale } from '../src/utils/normalize';

const MAX_PAGES = 10; // Mercado Livre has ~48 results per page, 10 pages = ~480 items
const BASE_URL = 'https://imoveis.mercadolivre.com.br/aluguel/apartamentos/rio-de-janeiro/rio-de-janeiro/_PriceRange_0-1000';
const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

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

async function fetchWithGooglebot(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': GOOGLEBOT_UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        });
        if (!response.ok) return null;
        return await response.text();
    } catch (e) {
        return null;
    }
}

async function scrapeML() {
    console.log(`\n🔍 Iniciando Deep Scraper (v3 - Cheerio) para Mercado Livre...`);

    const { data: existingData } = await supabase.from('properties').select('id').eq('source', 'mercadolivre');
    const existingIds = new Set(existingData?.map(p => p.id) || []);
    console.log(`🗄️ Base atual tem ${existingIds.size} imóveis do Mercado Livre salvos.`);

    let currentUrl = BASE_URL;
    const discoveredCards = new Map<string, Partial<Property>>();

    console.log(`\n📡 Fase 1: Discovery (Buscando anúncios no Mercado Livre)...`);
    
    for (let p = 1; p <= MAX_PAGES; p++) {
        process.stdout.write(`   Pesquisando Vitrine [${p}/${MAX_PAGES}]...\r`);
        
        const html = await fetchWithGooglebot(currentUrl);
        if (!html) {
            console.log(`\n   ❌ Erro ao baixar a página ${p}.`);
            break;
        }

        const $ = cheerio.load(html);
        const cards = $('.ui-search-layout__item');
        if (cards.length === 0) {
            console.log(`\n   ⏹️ Sem resultados na página ${p}. Parando vitrine.`);
            break;
        }

        cards.each((_, el) => {
            const card = $(el);
            const linkEl = card.find('a.poly-component__title');
            const url = linkEl.attr('href') || '';
            if (!url || !url.includes('mercadolivre.com.br/MLB')) return;

            const idMatch = url.match(/MLB-?(\d+)/i);
            if (!idMatch) return;
            const id = `ml-${idMatch[1]}`;
            
            if (existingIds.has(id)) return;

            const title = linkEl.text().trim() || 'Imóvel ML';
            const priceText = card.find('.andes-money-amount__fraction').first().text();
            const price = parseInt(priceText.replace(/\./g, ''), 10) || 0;
            if (price <= 0 || price > 1000) return;

            let area = 0;
            let rooms = 0;
            card.find('.poly-attributes_list__item').each((_, attr) => {
                const text = $(attr).text().toLowerCase();
                if (text.includes('m²')) area = parseInt(text.replace(/[^\d]/g, ''), 10) || 0;
                if (text.includes('quarto')) rooms = parseInt(text.replace(/[^\d]/g, ''), 10) || 0;
            });
            if (rooms === 0 && /(kitnet|quitinete|studio|loft|flat|conjugado)/i.test(title)) {
                rooms = 0;
            } else if (rooms === 0) {
                rooms = 1; // Default
            }

            const location = card.find('.poly-component__location').text().trim() || 'Rio de Janeiro';
            const zone = classifyZone(location);

            const imgEl = card.find('img.poly-component__picture');
            const image = imgEl.attr('data-src') || imgEl.attr('src') || '';

            discoveredCards.set(id, {
                id, title, price, condominio: 0, url: url.split('#')[0],
                image, rooms, bathrooms: 1, area, location, neighborhood: location, zone,
                source: 'mercadolivre', found_at: new Date().toISOString()
            });
        });

        const nextBtn = $('a.andes-pagination__link[title="Seguinte"]');
        const nextUrl = nextBtn.attr('href');
        if (nextUrl) {
            currentUrl = nextUrl;
            await new Promise(r => setTimeout(r, 1000)); // Be gentle
        } else {
            break;
        }
    }

    console.log(`\n   ✅ Fase 1 finalizada. Iniciando análise profunda de ${discoveredCards.size} anúncios...`);

    // ========================================
    // FASE 2: DEEP SCRAPING
    // ========================================
    const newPropertiesForSupabase: Property[] = [];
    let processed = 0;
    const cardsToScrape = Array.from(discoveredCards.values());

    for (const partialProp of cardsToScrape) {
        processed++;
        process.stdout.write(`   ⬇️ [${processed}/${cardsToScrape.length}] Entrando no anúncio...\r`);
        
        try {
            const html = await fetchWithGooglebot(partialProp.url!);
            if (!html) continue;

            const $ = cheerio.load(html);
            let description = '';
            
            // Tenta pegar do script JSON-LD (mais estruturado)
            $('script[type="application/ld+json"]').each((_, script) => {
                try {
                    const j = JSON.parse($(script).text());
                    if (j['@type'] === 'Product' || j['@type'] === 'Apartment' || j['@type'] === 'House' || j.description) {
                        if (j.description) description = j.description;
                    }
                } catch (e) {}
            });

            // Fallback para o HTML da descrição
            if (!description) {
                description = $('.ui-pdp-description__content').text().trim();
            }

            // Extrair galeria de imagens
            const images: string[] = [];
            $('.ui-pdp-gallery__column figure img.ui-pdp-image').each((_, img) => {
                const src = $(img).attr('data-src') || $(img).attr('src');
                if (src && !images.includes(src)) {
                    images.push(src.replace('I.webp', 'O.webp')); // Full resolution trick
                    if (images.length >= 10) return false; // Break Cheerio each loop
                }
            });

            const finalDescription = description || partialProp.title || '';
            const descLower = finalDescription.toLowerCase();

            // 🛡️ DEEP FILTERING
            if (isForSale(partialProp.title!, finalDescription)) {
                // Skip silently to reduce console noise
                continue;
            }
            if (isCommercial(partialProp.title!, finalDescription)) {
                continue;
            }

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
                source: partialProp.source!,
                directOwner,
                found_at: partialProp.found_at!
            };

            newPropertiesForSupabase.push(property);
            existingIds.add(property.id);
            
            // Be gentle with the API
            await new Promise(r => setTimeout(r, 800));
        } catch (e) { }
    }

    if (newPropertiesForSupabase.length > 0) {
        await saveProperties(newPropertiesForSupabase, 'Mercado Livre');
    } else {
        console.log(`\n   Nenhum imóvel novo e válido encontrado após os filtros.`);
    }

    console.log(`\n🏁 Concluído! O Deep Scraper ML (Cheerio) injetou ${newPropertiesForSupabase.length} anúncios purificados no banco.`);
}

scrapeML().catch(console.error);
