import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

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
    location: string;
    neighborhood: string;
    zone: string;
    description: string;
    found_at: string;
}

const startUrl = 'https://www.olx.com.br/imoveis/aluguel/estado-rj/rio-de-janeiro-e-regiao?pe=1000';
const dataPath = path.resolve('../web/src/data/properties.json');

async function run() {
    console.log('Starting stealth scraper for whole RJ region...');
    
    // Load existing properties if any
    let properties: Property[] = [];
    try {
        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath, 'utf-8');
            if (rawData.trim() !== '') {
                 properties = JSON.parse(rawData);
            }
        }
    } catch (e) {
        console.error('Could not read existing data, starting fresh.', e);
    }

    const existingIds = new Set(properties.map(p => p.id));

    const browser = await chromium.launch({
        headless: true, // Let's use true for GitHub Actions
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    console.log(`Navigating to ${startUrl}...`);
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    try {
        console.log('Waiting for listings to load...');
        await page.waitForSelector('a', { timeout: 15000 });
        await page.waitForTimeout(3000); // Let JS execute
    } catch (e) {
        console.log('Timeout waiting for links...');
    }

    const listings = await page.$$eval('a', (elements) => {
        return elements
            .filter(el => {
                const href = (el as HTMLAnchorElement).href;
                return href && href.includes('/imoveis/') && href.match(/-\d+(\?|$)/);
            })
            .map(el => {
                const url = (el as HTMLAnchorElement).href;
                const textContent = el.textContent || '';
                
                const imgEl = el.querySelector('img');
                const image = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '') : '';
                
                // Try to find location span which usually contains "Rio de Janeiro, Bairro"
                const spans = Array.from(el.querySelectorAll('span'));
                const locationSpan = spans.find(s => s.textContent?.includes(','));
                const locationText = locationSpan ? locationSpan.textContent || '' : '';

                return { url, textContent, image, locationText };
            });
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

    console.log(`Found ${uniqueListings.length} unique listings on the page.`);

    let newCount = 0;

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
                title = parts[0].trim().substring(0, 60);
            }

            // Extract Neighborhood and Zone
            // Usually olx location text is like "Rio de Janeiro, Copacabana" or "Rio de Janeiro, Zona Norte"
            let neighborhood = "Desconhecido";
            let zone = "Geral";
            if (item.locationText) {
                const locParts = item.locationText.split(',');
                if (locParts.length > 1) {
                    let extracted = locParts[locParts.length - 1].trim();
                    // Some might say "Zona Oeste" directly as neighborhood.
                    if (extracted.toLowerCase().includes('zona oeste')) zone = 'Oeste';
                    else if (extracted.toLowerCase().includes('zona norte')) zone = 'Norte';
                    else if (extracted.toLowerCase().includes('zona sul')) zone = 'Sul';
                    else if (extracted.toLowerCase().includes('centro')) zone = 'Centro';
                    
                    neighborhood = extracted.replace(/-\s*Zona.*/i, '').trim();
                } else {
                    neighborhood = item.locationText;
                }
            }

            // Infer zone from neighborhood if generic
            if (zone === "Geral") {
                const lowerNeighborhood = neighborhood.toLowerCase();
                const oeste = ['bangu', 'campo grande', 'santa cruz', 'barra', 'recreio', 'jacarepaguá', 'taquara', 'freguesia', 'anil', 'curicica', 'pechincha', 'praça seca', 'realengo', 'padre miguel', 'magalhães bastos', 'sulacap'];
                const norte = ['tijuca', 'méier', 'madureira', 'engenho', 'penha', 'bonsucesso', 'vila isabel', 'grajaú', 'maracanã', 'são cristóvão', 'irajá', 'pavuna', 'cascadura'];
                const sul = ['copacabana', 'ipanema', 'leblon', 'botafogo', 'flamengo', 'catete', 'laranjeiras', 'glória', 'leme', 'gávea', 'jardim botânico'];
                const centro = ['centro', 'lapa', 'cidade nova', 'gamboa', 'saúde', 'fátima'];

                if (oeste.some(b => lowerNeighborhood.includes(b))) zone = 'Oeste';
                else if (norte.some(b => lowerNeighborhood.includes(b))) zone = 'Norte';
                else if (sul.some(b => lowerNeighborhood.includes(b))) zone = 'Sul';
                else if (centro.some(b => lowerNeighborhood.includes(b))) zone = 'Centro';
            }

            const property: Property = {
                id,
                title,
                price,
                condominio: 0,
                url: item.url,
                image: item.image,
                rooms: item.textContent.toLowerCase().includes('2 quartos') || item.textContent.toLowerCase().includes('2 comodos') ? 2 : 1,
                bathrooms: 1,
                location: item.locationText || 'Rio de Janeiro, RJ',
                neighborhood,
                zone,
                description: item.textContent || '',
                found_at: new Date().toISOString()
            };

            properties.push(property);
            newCount++;
            console.log(`Saved property: ${property.title} - R$ ${property.price} no bairro ${property.neighborhood}`);
        }
    }

    // Save back to JSON
    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2));
    console.log(`Finished scraping. Added ${newCount} new properties. Total: ${properties.length}`);
    await browser.close();
}

run().catch(console.error);
