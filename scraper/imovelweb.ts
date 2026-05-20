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
    if (lower.includes('zona oeste') || lower.includes('campo grande') || lower.includes('bangu') || lower.includes('santa cruz') || lower.includes('realengo') || lower.includes('jacarepaguá') || lower.includes('barra')) return 'Oeste';
    if (lower.includes('zona norte') || lower.includes('tijuca') || lower.includes('méier') || lower.includes('madureira') || lower.includes('penha') || lower.includes('irajá') || lower.includes('pavuna') || lower.includes('cascadura') || lower.includes('ilha')) return 'Norte';
    if (lower.includes('zona sul') || lower.includes('copacabana') || lower.includes('ipanema') || lower.includes('leblon') || lower.includes('botafogo') || lower.includes('flamengo') || lower.includes('catete') || lower.includes('leme')) return 'Sul';
    if (lower.includes('centro') || lower.includes('lapa') || lower.includes('santa teresa')) return 'Centro';
    if (lower.includes('niterói') || lower.includes('niteroi')) return 'Niterói';
    if (lower.includes('são gonçalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('são joão de meriti')) return 'Baixada';
    return 'Geral';
}

async function scrapeImovelWeb() {
    console.log('\n🔍 Starting ImovelWeb scraper...');
    
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
            const url = pg === 1
                ? 'https://www.imovelweb.com.br/imoveis-aluguel-rio-de-janeiro-rj-ate-1000-reais.html'
                : `https://www.imovelweb.com.br/imoveis-aluguel-rio-de-janeiro-rj-ate-1000-reais-pagina-${pg}.html`;

            console.log(`\n   📄 Page ${pg}/${MAX_PAGES}: ${url.substring(0, 80)}...`);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
            await page.waitForTimeout(4000);

            // Scroll
            for (let i = 0; i < 5; i++) {
                await page.evaluate(() => window.scrollBy(0, 800));
                await page.waitForTimeout(500);
            }

            // Extract cards - ImovelWeb uses different selectors
            const cards = await page.evaluate(() => {
                // Try multiple selectors that ImovelWeb might use
                const selectors = [
                    '[data-qa="posting"]',
                    '.postingCard',
                    'div[data-id]',
                    '.listing-item',
                    'article',
                    'a[href*="/propriedades/"]',
                    'a[href*="/imoveis/"]',
                ];
                
                let elements: Element[] = [];
                for (const sel of selectors) {
                    const found = Array.from(document.querySelectorAll(sel));
                    if (found.length > 3) {
                        elements = found;
                        break;
                    }
                }

                // Also try finding all links to property pages
                if (elements.length === 0) {
                    const allLinks = Array.from(document.querySelectorAll('a[href*="/propriedades/"], a[href*="imovel-"]'));
                    if (allLinks.length > 0) elements = allLinks;
                }

                return {
                    cards: elements.map(el => {
                        const link = el.tagName === 'A' ? el as HTMLAnchorElement : el.querySelector('a');
                        const text = el.textContent || '';
                        const imgs = Array.from(el.querySelectorAll('img'));
                        const imgSrc = imgs
                            .map(i => i.src || i.getAttribute('data-src') || '')
                            .find(s => s && !s.includes('data:image') && !s.includes('svg') && !s.includes('logo')) || '';
                        
                        return {
                            href: link?.href || '',
                            text,
                            image: imgSrc,
                            id: el.getAttribute('data-id') || el.getAttribute('data-qa') || '',
                        };
                    }),
                    pageTitle: document.title,
                    totalLinks: document.querySelectorAll('a').length,
                };
            });

            console.log(`   Page: "${cards.pageTitle}" — ${cards.cards.length} cards, ${cards.totalLinks} links`);

            let pageNew = 0;
            for (const card of cards.cards) {
                if (!card.href || card.href === '') continue;

                // Generate ID from URL
                const urlParts = card.href.split('/').filter(Boolean);
                const slug = urlParts[urlParts.length - 1] || '';
                const idHash = slug.replace(/\.html$/, '').substring(0, 30);
                if (!idHash) continue;
                
                const id = `imovelweb_${idHash}`;
                if (existingIds.has(id)) continue;

                // Parse price
                const priceMatch = card.text.match(/R\$\s*([\d.]+)/i);
                if (!priceMatch) continue;
                const price = parseFloat(priceMatch[1].replace('.', ''));
                if (price <= 0 || price > 1000) continue;

                // Parse location/neighborhood
                const locParts = card.text.match(/([\wÀ-ÿ\s]+),\s*Rio de Janeiro/i);
                const neighborhood = locParts ? locParts[1].trim() : 'Desconhecido';

                // Area
                const areaMatch = card.text.match(/(\d+)\s*m²/);
                const area = areaMatch ? parseInt(areaMatch[1]) : 0;

                // Rooms
                const roomsMatch = card.text.match(/(\d+)\s*(?:quarto|dorm|hab)/i);
                const rooms = roomsMatch ? parseInt(roomsMatch[1]) : 0;

                // Bathrooms
                const bathMatch = card.text.match(/(\d+)\s*(?:banheiro|banh)/i);
                const bathrooms = bathMatch ? parseInt(bathMatch[1]) : 1;

                const zone = classifyZone(card.href + ' ' + neighborhood);

                const property: Property = {
                    id,
                    title: `Imóvel em ${neighborhood} — ${area > 0 ? area + 'm²' : 'Aluguel'}`,
                    price,
                    condominio: 0,
                    url: card.href,
                    image: card.image,
                    rooms,
                    bathrooms,
                    area,
                    location: `Rio de Janeiro, ${neighborhood}`,
                    neighborhood,
                    zone,
                    description: card.text.substring(0, 300),
                    source: 'imovelweb',
                    directOwner: false,
                    found_at: new Date().toISOString()
                };

                properties.push(property);
                existingIds.add(id);
                pageNew++;
                totalNew++;
                console.log(`   ✅ R$${price} — ${neighborhood} (${zone})`);
            }

            console.log(`   +${pageNew} new from page ${pg}`);
            if (pageNew === 0 && cards.cards.length === 0) {
                console.log(`   ⏹️ No more results.`);
                break;
            }

        } catch (e: any) {
            console.log(`   ❌ Page ${pg} error: ${e.message}`);
        }
    }

    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2));
    console.log(`\n🏁 Finished ImovelWeb. Added ${totalNew} new. Total: ${properties.length}`);
    await browser.close();
}

scrapeImovelWeb().catch(console.error);
