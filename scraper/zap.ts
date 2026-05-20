import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import type { Property } from './index';

chromium.use(stealth());

const dataPath = path.resolve('src/data/properties.json');

function classifyZone(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('zona oeste')) return 'Oeste';
    if (lower.includes('zona norte')) return 'Norte';
    if (lower.includes('zona sul')) return 'Sul';
    if (lower.includes('zona central') || lower.includes('centro')) return 'Centro';
    if (lower.includes('niterói')) return 'Niterói';
    if (lower.includes('são gonçalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('são joão de meriti') || lower.includes('itaguaí')) return 'Baixada';
    if (lower.includes('maricá')) return 'Maricá';
    if (lower.includes('teresópolis') || lower.includes('petrópolis')) return 'Serrana';
    return 'Geral';
}

async function scrapeSource(source: 'zap' | 'vivareal') {
    const siteName = source === 'zap' ? 'ZAP Imóveis' : 'VivaReal';
    const baseUrl = source === 'zap'
        ? 'https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel'
        : 'https://www.vivareal.com.br/aluguel/rj/rio-de-janeiro/?precoMaximo=1000';
    
    console.log(`\n🔍 Starting ${siteName} scraper...`);
    
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
    let newCount = 0;

    try {
        console.log(`📄 Navigating to ${baseUrl}...`);
        await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        // Scroll to load lazy content
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, 1000));
            await page.waitForTimeout(800);
        }

        // Extract card data from visible DOM
        const cards = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/imovel/"]'));
            return links.map(link => {
                // Walk up to find the <li> card container
                let card: HTMLElement | null = link as HTMLElement;
                for (let i = 0; i < 10; i++) {
                    if (card?.parentElement) card = card.parentElement;
                    if (card?.tagName === 'LI') break;
                }
                
                const text = card?.textContent || '';
                const href = (link as HTMLAnchorElement).href;
                
                // Get images
                const imgs = Array.from(card?.querySelectorAll('img') || []);
                const imgSrc = imgs
                    .map(i => i.src || i.getAttribute('data-src') || '')
                    .find(s => s && !s.includes('data:image') && !s.includes('svg')) || '';

                return { href, text, image: imgSrc };
            });
        });

        console.log(`   Found ${cards.length} property cards.`);

        for (const card of cards) {
            // Extract ID from URL
            const idMatch = card.href.match(/id-(\d+)/);
            if (!idMatch) continue;
            const id = `${source}_${idMatch[1]}`;
            if (existingIds.has(id)) continue;

            // Parse price: "R$ 950/mês"
            const priceMatch = card.text.match(/R\$\s*([\d.]+)\s*\/mês/i);
            if (!priceMatch) continue;
            const price = parseFloat(priceMatch[1].replace('.', ''));
            if (price <= 0 || price > 1000) continue;

            // Parse condomínio: "Cond. R$ 294"
            const condoMatch = card.text.match(/Cond\.\s*R\$\s*([\d.]+)/i);
            const condominio = condoMatch ? parseFloat(condoMatch[1].replace('.', '')) : 0;

            // Parse area: "55 m²" or "Tamanho do imóvel 55 m²"
            const areaMatch = card.text.match(/(\d+)\s*m²/);
            const area = areaMatch ? parseInt(areaMatch[1]) : 0;

            // Parse rooms: "Quantidade de quartos 2" or "2 quartos"
            const roomsMatch = card.text.match(/(?:Quantidade de quartos|(\d+)\s*quartos?)/i);
            const rooms = roomsMatch ? parseInt(roomsMatch[1] || card.text.match(/quartos?\s*(\d+)|(\d+)\s*quartos?/i)?.[1] || card.text.match(/Quantidade de quartos\s*(\d+)/)?.[1] || '1') : 1;

            // Parse bathrooms
            const bathMatch = card.text.match(/Quantidade de banheiros\s*(\d+)/i);
            const bathrooms = bathMatch ? parseInt(bathMatch[1]) : 1;

            // Parse neighborhood and city from text like "Realengo, Rio de Janeiro"
            // The pattern is: "em\nNeighborhood, City"
            const locMatch = card.text.match(/(?:em|emm)\s*([^,\n]+),\s*([^\n]+?)(?:Rua|Av\.|Estr|Tamanho)/i);
            let neighborhood = 'Desconhecido';
            let city = 'Rio de Janeiro';
            if (locMatch) {
                neighborhood = locMatch[1].trim();
                city = locMatch[2].trim();
            }

            // Zone from URL (most reliable for ZAP)
            const zone = classifyZone(card.href + ' ' + city + ' ' + neighborhood);

            // Title from text
            const titleMatch = card.text.match(/(?:Destaque|fotos)(.+?)(?:para alugar|em\s)/i);
            let title = titleMatch ? titleMatch[1].trim() : '';
            if (!title || title.length < 5) {
                // Fallback: build from type + neighborhood
                const typeMatch = card.text.match(/(Apartamento|Casa|Kitnet|Sobrado|Sala|Studio|Loft|Flat|Quitinete)[^\n]*/i);
                title = typeMatch ? typeMatch[0].substring(0, 80) : `Imóvel em ${neighborhood}`;
            }

            const property: Property = {
                id,
                title,
                price,
                condominio,
                url: card.href.split('?')[0], // Clean URL
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

            properties.push(property);
            existingIds.add(id);
            newCount++;
            console.log(`   ✅ ${title.substring(0, 50)} — R$${price} — ${neighborhood} (${zone})`);
        }

    } catch (e: any) {
        console.log(`   ❌ Error: ${e.message}`);
    }

    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2));
    console.log(`\n🏁 Finished ${siteName}. Added ${newCount} new. Total: ${properties.length}`);
    await browser.close();
}

(async () => {
    await scrapeSource('zap');
    await scrapeSource('vivareal');
})().catch(console.error);
