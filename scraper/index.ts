import { supabase } from '../src/lib/supabase';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { saveProperties } from './saveProperties';
import { isCommercial, isForSale } from '../src/utils/normalize';

chromium.use(stealth());

export interface Property {
    id: string;
    title: string;
    price: number;
    condominio: number;
    url: string;
    image: string;
    rooms: number;
    bathrooms: number;
    area: number;        // m²
    location: string;
    neighborhood: string;
    zone: string;
    description: string;
    source: string;      // 'olx' | 'zap' | 'vivareal'
    directOwner: boolean; // Direto com o proprietário
    found_at: string;
}

// ============================================================
// ZONE CLASSIFICATION — RJ Metropolitan Area
// ============================================================

function classifyByCity(locationText: string): string | null {
    const lower = locationText.toLowerCase();
    
    if (lower.includes('niterói')) return 'Niterói';
    if (lower.includes('são gonçalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias')) return 'Baixada';
    if (lower.includes('nova iguaçu')) return 'Baixada';
    if (lower.includes('são joão de meriti')) return 'Baixada';
    if (lower.includes('belford roxo')) return 'Baixada';
    if (lower.includes('nilópolis')) return 'Baixada';
    if (lower.includes('mesquita')) return 'Baixada';
    if (lower.includes('itaboraí')) return 'Baixada';
    if (lower.includes('maricá')) return 'Maricá';
    if (lower.includes('itaguaí')) return 'Baixada';
    if (lower.includes('teresópolis')) return 'Serrana';
    if (lower.includes('petrópolis')) return 'Serrana';
    if (lower.includes('mangaratiba')) return 'Costa Verde';
    if (lower.includes('angra dos reis')) return 'Costa Verde';
    if (lower.includes('magé')) return 'Baixada';
    if (lower.includes('queimados')) return 'Baixada';
    if (lower.includes('japeri')) return 'Baixada';
    if (lower.includes('seropédica')) return 'Baixada';
    if (lower.includes('rio bonito')) return 'Baixada';
    if (lower.includes('paracambi')) return 'Baixada';
    if (lower.includes('guapimirim')) return 'Baixada';
    
    return null;
}

const ZONES: Record<string, string[]> = {
    'Zona Oeste': [
        'bangu', 'campo grande', 'santa cruz', 'barra da tijuca', 'barra', 'recreio',
        'jacarepaguá', 'taquara', 'anil', 'curicica', 'pechincha', 'praça seca',
        'realengo', 'padre miguel', 'magalhães bastos', 'sulacap',
        'guaratiba', 'senador camará', 'paciência', 'santíssimo', 'cosmos',
        'sepetiba', 'vargem grande', 'vargem pequena', 'itanhangá',
        'gardênia azul', 'vila valqueire', 'tanque', 'campo dos afonsos',
        'camorim', 'grumari', 'joá', 'pedra de guaratiba', 'barra de guaratiba',
        'jardim sulacap', 'vila militar', 'deodoro', 'gericinó', 'mendanha',
        'senador vasconcelos', 'inhoaíba', 'augusto vasconcelos',
        'freguesia (jacarepaguá)', 'rio das pedras', 'cidade de deus',
    ],
    'Zona Norte': [
        'tijuca', 'méier', 'madureira', 'penha', 'bonsucesso', 'vila isabel',
        'grajaú', 'maracanã', 'são cristóvão', 'irajá', 'pavuna', 'cascadura',
        'engenho novo', 'engenho de dentro', 'engenho da rainha',
        'marechal hermes', 'guadalupe', 'coelho neto', 'anchieta', 'vigário geral',
        'ricardo de albuquerque', 'ramos', 'olaria', 'lins de vasconcelos',
        'brás de pina', 'vicente de carvalho', 'cachambi', 'honório gurgel',
        'jacaré', 'rocha miranda', 'bento ribeiro', 'tomás coelho',
        'encantado', 'vaz lobo', 'vila kosmos', 'higienópolis', 'riachuelo',
        'quintino bocaiúva', 'turiaçu', 'colégio', 'campinho', 'oswaldo cruz',
        'tauá', 'ilha do governador', 'ribeira', 'zumbi', 'cocotá', 'praia da bandeira',
        'freguesia (ilha do governador)', 'bancários', 'jardim guanabara',
        'portuguesa', 'pitangueiras', 'galeão', 'jardim carioca', 'cacuia',
        'moneró', 'penha circular', 'complexo do alemão', 'costa barros',
        'barros filho', 'acari', 'parque anchieta', 'jardim américa',
        'del castilho', 'inhaúma', 'abolição', 'piedade', 'pilares',
        'todos os santos', 'água santa', 'rocha', 'sampaio', 'são francisco xavier',
        'benfica', 'manguinhos', 'bonsucesso', 'cordovil', 'parada de lucas',
        'jardim américa', 'vista alegre', 'vila da penha',
    ],
    'Zona Sul': [
        'copacabana', 'ipanema', 'leblon', 'botafogo', 'flamengo', 'catete',
        'laranjeiras', 'glória', 'leme', 'gávea', 'jardim botânico',
        'humaitá', 'urca', 'cosme velho', 'lagoa', 'vidigal', 'rocinha',
        'são conrado', 'alto da boa vista',
    ],
    'Centro': [
        'centro', 'lapa', 'cidade nova', 'gamboa', 'saúde', 'fátima',
        'catumbi', 'santo cristo', 'rio comprido', 'santa teresa', 'estácio',
        'praça da bandeira', 'paquetá', 'caju',
    ],
};

function classifyByNeighborhood(neighborhood: string): string {
    const lower = neighborhood.toLowerCase();
    for (const [zone, neighborhoods] of Object.entries(ZONES)) {
        if (neighborhoods.some(b => lower.includes(b))) {
            return zone;
        }
    }
    return 'Geral';
}

function isDirectOwner(text: string): boolean {
    return text.toLowerCase().includes('direto com o proprietário');
}

// ============================================================
// MAIN DEEP SCRAPER (v2)
// ============================================================

const startUrl = 'https://www.olx.com.br/imoveis/aluguel/estado-rj/rio-de-janeiro-e-regiao?pe=1000';

async function scrapeOLX() {
    console.log('\n🔍 Iniciando OLX Deep Scraper (v2) - O Robô Cirurgião');
    
    // 1. Carregar IDs já conhecidos do banco para evitar navegação desnecessária
    const { data: existingData } = await supabase.from('properties').select('id').eq('source', 'olx');
    const existingIds = new Set(existingData?.map(p => p.id) || []);
    console.log(`🗄️ Base atual tem ${existingIds.size} imóveis da OLX salvos.`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    const maxPages = 20;
    const discoveredUrls = new Set<string>();

    // ========================================
    // FASE 1: DISCOVERY (Crawling Superficial)
    // ========================================
    console.log('\n📡 Fase 1: Discovery (Buscando novos links)...');
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const pageUrl = pageNum === 1 ? startUrl : `${startUrl}&o=${pageNum}`;
        process.stdout.write(`   Pesquisando Vitrine [${pageNum}/${maxPages}]...\r`);
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        try {
            await page.waitForSelector('section', { timeout: 15000 });
        } catch (e) {
            console.log(`\n   ⏰ Timeout na vitrine ${pageNum}, parando paginação.`);
            break;
        }

        const links = await page.$$eval('section a[href*="/imoveis/"]', els => els.map(el => (el as HTMLAnchorElement).href));
        for (const link of links) {
            const idMatch = link.match(/-(\d+)(?:\?|$)/);
            if (idMatch) discoveredUrls.add(link.split('?')[0]);
        }
    }
    console.log(`\n   ✅ Discovery concluído. ${discoveredUrls.size} URLs encontradas na vitrine.`);

    // ========================================
    // FILTRO DE INÉDITOS
    // ========================================
    const urlsToScrape: string[] = [];
    for (const url of discoveredUrls) {
        const idMatch = url.match(/-(\d+)(?:\?|$)/);
        const id = idMatch ? `olx_${idMatch[1]}` : null;
        if (id && !existingIds.has(id)) {
            urlsToScrape.push(url);
        }
    }

    console.log(`\n🎯 Resultado: ${urlsToScrape.length} anúncios INÉDITOS para Deep Scraping.`);

    // ========================================
    // FASE 2: DEEP SCRAPING (Extrator Cirúrgico)
    // ========================================
    const newPropertiesForSupabase: Property[] = [];
    let processed = 0;

    for (const url of urlsToScrape) {
        processed++;
        const idMatch = url.match(/-(\d+)(?:\?|$)/);
        const id = `olx_${idMatch![1]}`;

        try {
            process.stdout.write(`   ⬇️ [${processed}/${urlsToScrape.length}] Entrando no anúncio...\r`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // O tesouro da OLX fica enterrado na tag __NEXT_DATA__
            const dataJson = await page.$eval('#initial-data', el => el.getAttribute('data-json')).catch(() => null);
            if (!dataJson) {
                console.log(`   ⚠️ [${processed}/${urlsToScrape.length}] Fallback estrutural: Sem JSON puro. URL: ${url}`);
                continue;
            }

            const ad = JSON.parse(dataJson).ad;
            
            // 🛡️ BARREIRAS DE PROTEÇÃO E DEEP FILTERING
            const categoryName = ad.categoryName?.toLowerCase() || '';
            const parentCategoryName = ad.parentCategoryName?.toLowerCase() || '';
            const bodyLower = (ad.body || '').toLowerCase();
            const titleLower = (ad.subject || '').toLowerCase();
            
            // Regra 1: Oficialmente classificado como comercial
            if (categoryName.includes('comércio') || categoryName.includes('terrenos') || categoryName.includes('lojas')) {
                console.log(`   🚫 Bloqueado: Categoria Comercial da OLX identificada (${categoryName})`);
                continue;
            }

            // 🛡️ DEEP FILTERING
            if (isForSale(titleLower, bodyLower)) {
                console.log(`   🚫 Bloqueado: Semântica de venda na descrição profunda. (${url})`);
                continue;
            }

            if (isCommercial(titleLower, bodyLower)) {
                console.log(`   🚫 Bloqueado: Uso comercial detectado na descrição profunda. (${url})`);
                continue;
            }

            // ========================================
            // MONTAGEM DO PAYLOAD
            // ========================================
            const priceStr = ad.priceValue || '';
            const price = parseFloat(priceStr.replace(/\D/g, '')) || 0;
            if (price <= 0 || price > 1000) {
                 console.log(`   🚫 Bloqueado: Preço inválido ou fora da janela aceitável (R$ ${price})`);
                 continue;
            }

            const props = ad.properties || [];
            const getProp = (name: string) => props.find((p: any) => p.name === name)?.value || '';

            const condStr = getProp('condominio');
            const sizeStr = getProp('size');
            const roomsStr = getProp('rooms');
            const bathStr = getProp('bathrooms');

            const title = ad.subject || 'Imóvel no RJ';
            const description = ad.body || '';
            const image = ad.images && ad.images.length > 0 ? ad.images[0].original : '';

            // Localização precisa (A OLX já destrincha estado e bairro internamente)
            const loc = ad.location || {};
            const city = loc.municipality || 'Rio de Janeiro';
            const neighborhood = loc.neighbourhood || 'Desconhecido';
            const locationText = `${city}, ${neighborhood}`;

            let zone = 'Geral';
            const cityZone = classifyByCity(locationText);
            if (cityZone) {
                zone = cityZone;
            } else if (neighborhood !== 'Desconhecido') {
                zone = classifyByNeighborhood(neighborhood);
            }

            // Regra para Kitnets/Studios no Deep Scrape (Ajuste de UI)
            let roomsRaw = parseInt(roomsStr.replace(/\D/g, ''));
            if (isNaN(roomsRaw)) {
                roomsRaw = /(kitnet|quitinete|studio|loft|flat|conjugado)/i.test(title) ? 0 : 1;
            }

            const property: Property = {
                id,
                title: title.substring(0, 80),
                price,
                condominio: parseFloat(condStr.replace(/\D/g, '')) || 0,
                url,
                image,
                rooms: roomsRaw,
                bathrooms: parseInt(bathStr.replace(/\D/g, '')) || 1,
                area: parseInt(sizeStr.replace(/\D/g, '')) || 0,
                location: locationText,
                neighborhood,
                zone,
                description: description.substring(0, 500),
                source: 'olx',
                directOwner: isDirectOwner(description),
                found_at: new Date().toISOString()
            };

            newPropertiesForSupabase.push(property);
            existingIds.add(id);
            console.log(`   ✅ Deep Scraped: ${property.title.substring(0, 40)} (R$ ${price})`);

        } catch (e: any) {
             console.log(`   ❌ Erro durante o deep scrape do anúncio: ${e.message}`);
        }
    }

    if (newPropertiesForSupabase.length > 0) {
        await saveProperties(newPropertiesForSupabase, 'OLX');
    }

    console.log(`\n🏁 Concluído! O Deep Scraper da OLX injetou ${newPropertiesForSupabase.length} anúncios cirurgicamente purificados no banco.`);
    await browser.close();
}

scrapeOLX().catch(console.error);
