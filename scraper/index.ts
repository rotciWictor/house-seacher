import { supabase } from '../src/lib/supabase';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { saveProperties } from './saveProperties';

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

// STEP 1: Classify by CITY name (from location text)
function classifyByCity(locationText: string): string | null {
    const lower = locationText.toLowerCase();
    
    // Extract city part (usually before the comma: "São Gonçalo, Bairro")
    // or sometimes the whole text contains the city name
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

// STEP 2: Classify by NEIGHBORHOOD name (for Rio de Janeiro city)
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

function isTimestamp(text: string): boolean {
    return /^\d{1,2}:\d{2}$/.test(text.trim());
}

// ============================================================
// EXTRACT MORE DATA FROM TEXT
// ============================================================

function extractRooms(text: string, title: string): number {
    const match = text.match(/(\d+)\s*(?:quarto|dormitório|cômodo|comodo)/i);
    if (match) return parseInt(match[1]);
    
    // Se for kitnet, loft, studio e não mencionar quartos, define como 0 (botão Kitnet na UI)
    if (/(kitnet|quitinete|studio|loft|flat|conjugado)/i.test(title)) return 0;
    
    return 1;
}

function extractBathrooms(text: string): number {
    const match = text.match(/(\d+)\s*(?:banheiro|wc|lavabo)/i);
    return match ? parseInt(match[1]) : 1;
}

function extractArea(text: string): number {
    const match = text.match(/(\d+)\s*m²/i);
    return match ? parseInt(match[1]) : 0;
}

function extractCondominio(text: string): number {
    const match = text.match(/condom[ií]nio.*?R\$\s*([\d.]+)/i);
    return match ? parseFloat(match[1].replace('.', '')) : 0;
}

function isDirectOwner(text: string): boolean {
    return text.toLowerCase().includes('direto com o proprietário');
}

// ============================================================
// MAIN SCRAPER
// ============================================================

const startUrl = 'https://www.olx.com.br/imoveis/aluguel/estado-rj/rio-de-janeiro-e-regiao?pe=1000';

async function scrapeOLX() {
    console.log('🔍 Starting OLX stealth scraper for RJ region...');
    
    const { data: existingData } = await supabase.from('properties').select('id').eq('source', 'olx');
    const existingIds = new Set(existingData?.map(p => p.id) || []);

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
    let newCount = 0;
    const newPropertiesForSupabase: Property[] = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const pageUrl = pageNum === 1 ? startUrl : `${startUrl}&o=${pageNum}`;
        console.log(`📄 Page ${pageNum}: ${pageUrl}`);
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        try {
            await page.waitForSelector('section', { timeout: 15000 });
            await page.waitForTimeout(3000);
        } catch (e) {
            console.log(`⏰ Timeout on page ${pageNum}, stopping.`);
            break;
        }

        const listings = await page.$$eval('section', (elements) => {
            return elements
                .map(el => {
                    const aTag = el.querySelector('a[href*="/imoveis/"]');
                    if (!aTag) return null;
                    const url = (aTag as HTMLAnchorElement).href;
                    if (!url.match(/-\d+(\?|$)/)) return null;

                    const textContent = el.textContent || '';
                    
                    const imgEl = el.querySelector('img');
                    let image = imgEl ? (imgEl.getAttribute('src') || '') : '';
                    if (image.includes('data:image')) {
                        image = imgEl?.getAttribute('srcset')?.split(' ')[0] || image;
                    }
                    
                    const spans = Array.from(el.querySelectorAll('span, p'));
                    const locationSpan = spans.find(s => s.textContent?.includes(','));
                    const locationText = locationSpan ? locationSpan.textContent || '' : '';

                    return { url, textContent, image, locationText };
                })
                .filter(item => item !== null) as {url: string, textContent: string, image: string, locationText: string}[];
        });

        const uniqueListings = [];
        const seenUrls = new Set();
        for (const item of listings) {
            const idMatch = item.url.match(/-(\d+)(?:\?|$)/);
            const id = idMatch ? idMatch[1] : null;
            if (id && !seenUrls.has(id)) {
                seenUrls.add(id);
                uniqueListings.push(item);
            }
        }

        console.log(`   Found ${uniqueListings.length} unique listings.`);

        for (const item of uniqueListings) {
            const idMatch = item.url.match(/-(\d+)(?:\?|$)/);
            const id = idMatch ? idMatch[1] : Buffer.from(item.url || '').toString('base64').substring(0, 10);
            
            if (existingIds.has(id)) continue;

            const priceMatch = item.textContent.match(/R\$\s*([\d.]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace('.', '')) : 0;

            if (price > 0 && price <= 1000) {
                let title = "Imóvel no RJ";
                const parts = item.textContent.split(/(?:R\$)|(?:\d+ quartos)|(?:condomínio)/i);
                if (parts.length > 0 && parts[0].trim().length > 5) {
                    title = parts[0].trim().substring(0, 80);
                }

                // --- ZONE CLASSIFICATION ---
                let neighborhood = "Desconhecido";
                let zone = "Geral";
                
                if (item.locationText) {
                    const locParts = item.locationText.split(',');
                    if (locParts.length > 1) {
                        let extracted = locParts[locParts.length - 1].trim();
                        
                        // Fix: skip if it's a timestamp like "14:55"
                        if (isTimestamp(extracted) && locParts.length > 2) {
                            extracted = locParts[locParts.length - 2].trim();
                        }
                        if (isTimestamp(extracted)) {
                            extracted = locParts[0].trim();
                        }
                        
                        // Check for explicit zone text
                        if (extracted.toLowerCase().includes('zona oeste')) zone = 'Oeste';
                        else if (extracted.toLowerCase().includes('zona norte')) zone = 'Norte';
                        else if (extracted.toLowerCase().includes('zona sul')) zone = 'Sul';
                        else if (extracted.toLowerCase().includes('centro')) zone = 'Centro';
                        
                        neighborhood = extracted.replace(/-\s*Zona.*/i, '').trim();
                    } else {
                        neighborhood = item.locationText.trim();
                    }
                    
                    // STEP 1: Try to classify by city name
                    if (zone === 'Geral') {
                        const cityZone = classifyByCity(item.locationText);
                        if (cityZone) zone = cityZone;
                    }
                }

                // STEP 2: Try to classify by neighborhood
                if (zone === 'Geral' && neighborhood !== 'Desconhecido') {
                    zone = classifyByNeighborhood(neighborhood);
                }

                const property: Property = {
                    id,
                    title,
                    price,
                    condominio: extractCondominio(item.textContent),
                    url: item.url,
                    image: item.image,
                    rooms: extractRooms(item.textContent, title),
                    bathrooms: extractBathrooms(item.textContent),
                    area: extractArea(item.textContent),
                    location: item.locationText || 'Rio de Janeiro, RJ',
                    neighborhood,
                    zone,
                    description: item.textContent || '',
                    source: 'olx',
                    directOwner: isDirectOwner(item.textContent),
                    found_at: new Date().toISOString()
                };

                newPropertiesForSupabase.push(property);
                existingIds.add(id);
                newCount++;
                console.log(`   ✅ ${property.title.substring(0, 50)} — R$${property.price} — ${property.neighborhood} (${property.zone})`);
            }
        }
    }

    await saveProperties(newPropertiesForSupabase, 'OLX');

    console.log(`\n🏁 Finished OLX. Added ${newCount} new. Total IDs tracked: ${existingIds.size}`);
    await browser.close();
}

scrapeOLX().catch(console.error);
