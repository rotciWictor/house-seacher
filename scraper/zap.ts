import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import type { Property } from './index';

chromium.use(stealth());

const dataPath = path.resolve('src/data/properties.json');

function classifyByCity(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('niterói')) return 'Niterói';
    if (lower.includes('são gonçalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('são joão de meriti') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('itaboraí') || lower.includes('itaguaí') || lower.includes('magé') || lower.includes('queimados')) return 'Baixada';
    if (lower.includes('maricá')) return 'Maricá';
    if (lower.includes('teresópolis') || lower.includes('petrópolis')) return 'Serrana';
    return 'Geral';
}

interface ZapListing {
    listing?: {
        id?: string;
        title?: string;
        description?: string;
        usableAreas?: number[];
        bedrooms?: number[];
        bathrooms?: number[];
        parkingSpaces?: number[];
        pricingInfos?: Array<{
            businessType?: string;
            monthlyRentalTotalPrice?: string;
            price?: string;
            monthlyCondoFee?: string;
        }>;
        address?: {
            city?: string;
            neighborhood?: string;
            street?: string;
            zipCode?: string;
            point?: { lat?: number; lon?: number };
        };
        publicationType?: string;
    };
    medias?: Array<{
        url?: string;
        type?: string;
    }>;
    link?: {
        href?: string;
    };
    account?: {
        name?: string;
    };
}

async function scrapeZAP(source: 'zap' | 'vivareal') {
    const siteName = source === 'zap' ? 'ZAP Imóveis' : 'VivaReal';
    const baseUrl = source === 'zap'
        ? 'https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel'
        : 'https://www.vivareal.com.br/aluguel/rj/rio-de-janeiro/?precoMaximo=1000';
    
    console.log(`\n🔍 Starting ${siteName} scraper...`);
    
    let properties: Property[] = [];
    try {
        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath, 'utf-8');
            if (rawData.trim() !== '') {
                properties = JSON.parse(rawData);
            }
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
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(5000);

        // Try to extract __NEXT_DATA__
        const nextData = await page.evaluate(() => {
            const el = document.getElementById('__NEXT_DATA__');
            if (el) {
                try { return JSON.parse(el.textContent || ''); } catch { return null; }
            }
            return null;
        });

        if (nextData) {
            console.log(`   ✅ Found __NEXT_DATA__! Parsing listings...`);
            
            // Navigate through the data structure to find listings
            let listings: ZapListing[] = [];
            
            try {
                // Common paths in ZAP/VivaReal Next.js data
                const pageProps = nextData?.props?.pageProps;
                if (pageProps?.searchResult?.listings) {
                    listings = pageProps.searchResult.listings;
                } else if (pageProps?.initialProps?.searchResult?.listings) {
                    listings = pageProps.initialProps.searchResult.listings;
                } else if (pageProps?.data?.search?.result?.listings) {
                    listings = pageProps.data.search.result.listings;
                }
            } catch (e) {
                console.log(`   ⚠️ Could not find listings in __NEXT_DATA__ structure.`);
                // Dump keys for debugging
                const keys = Object.keys(nextData?.props?.pageProps || {});
                console.log(`   Available keys: ${keys.join(', ')}`);
            }

            console.log(`   Found ${listings.length} listings in JSON.`);

            for (const item of listings) {
                const listing = item.listing;
                if (!listing) continue;

                const id = `${source}_${listing.id || Math.random().toString(36).substring(7)}`;
                if (existingIds.has(id)) continue;

                // Get rental price
                const pricingInfo = listing.pricingInfos?.find(p => p.businessType === 'RENTAL');
                const priceStr = pricingInfo?.monthlyRentalTotalPrice || pricingInfo?.price || '0';
                const price = parseFloat(priceStr);
                if (price <= 0 || price > 1000) continue;

                const condoStr = pricingInfo?.monthlyCondoFee || '0';
                const condominio = parseFloat(condoStr) || 0;

                const address = listing.address || {};
                const neighborhood = address.neighborhood || 'Desconhecido';
                const city = address.city || '';
                const zone = classifyByCity(city + ' ' + neighborhood);

                const image = item.medias?.[0]?.url || '';
                const href = item.link?.href || '';
                const fullUrl = href.startsWith('http') ? href : `https://www.${source === 'zap' ? 'zapimoveis.com.br' : 'vivareal.com.br'}${href}`;

                const property: Property = {
                    id,
                    title: listing.title || listing.description?.substring(0, 80) || `Imóvel em ${neighborhood}`,
                    price,
                    condominio,
                    url: fullUrl,
                    image,
                    rooms: listing.bedrooms?.[0] || 1,
                    bathrooms: listing.bathrooms?.[0] || 1,
                    area: listing.usableAreas?.[0] || 0,
                    location: `${city}, ${neighborhood}`,
                    neighborhood,
                    zone,
                    description: listing.description || '',
                    source,
                    directOwner: listing.publicationType === 'OWNER' || (item.account?.name || '').toLowerCase().includes('proprietário'),
                    found_at: new Date().toISOString()
                };

                properties.push(property);
                existingIds.add(id);
                newCount++;
                console.log(`   ✅ ${property.title.substring(0, 50)} — R$${property.price} — ${property.neighborhood} (${property.zone})`);
            }
        } else {
            console.log(`   ⚠️ No __NEXT_DATA__ found. Cloudflare may have blocked us.`);
            console.log(`   Trying fallback: scraping visible DOM...`);
            
            // Fallback: try to scrape visible content like we do with OLX
            const pageTitle = await page.title();
            console.log(`   Page title: ${pageTitle}`);
            
            if (pageTitle.toLowerCase().includes('challenge') || pageTitle.toLowerCase().includes('cloudflare')) {
                console.log(`   ❌ Cloudflare challenge detected. ${siteName} blocked us.`);
            }
        }
    } catch (e) {
        console.log(`   ❌ Error scraping ${siteName}:`, e);
    }

    // Save
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2));
    console.log(`\n🏁 Finished ${siteName}. Added ${newCount} new. Total: ${properties.length}`);
    await browser.close();
}

// Run both
(async () => {
    await scrapeZAP('zap');
    await scrapeZAP('vivareal');
})().catch(console.error);
