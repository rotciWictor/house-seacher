import fs from 'fs';
import path from 'path';
import type { Property } from './index';

const dataPath = path.resolve('src/data/properties.json');

// Mercado Livre OAuth Credentials
const ML_APP_ID = process.env.ML_APP_ID || '712797680476379';
const ML_SECRET = process.env.ML_SECRET || 'NpBOTRf0OWlamDcIKYqDDc8uaP3o6Fdx';

function classifyZone(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('niterói') || lower.includes('niteroi')) return 'Niterói';
    if (lower.includes('são gonçalo') || lower.includes('sao goncalo')) return 'São Gonçalo';
    if (lower.includes('duque de caxias') || lower.includes('nova iguaçu') || lower.includes('belford roxo') || lower.includes('nilópolis') || lower.includes('mesquita') || lower.includes('são joão de meriti')) return 'Baixada';
    if (lower.includes('maricá')) return 'Maricá';
    if (lower.includes('petrópolis') || lower.includes('teresópolis')) return 'Serrana';

    const oeste = ['campo grande','santa cruz','bangu','realengo','padre miguel','senador camará','cosmos','inhoaíba','paciência','sepetiba','guaratiba','vargem grande','vargem pequena','recreio','barra da tijuca','jacarepaguá','taquara','tanque','pechincha','anil','curicica','freguesia','praça seca','vila valqueire','deodoro','santíssimo','barra olímpica'];
    const norte = ['méier','madureira','cascadura','quintino','piedade','pilares','engenho de dentro','engenho novo','todos os santos','cachambi','tijuca','andaraí','grajaú','maracanã','vila isabel','irajá','vicente de carvalho','vila da penha','penha','penha circular','olaria','ramos','bonsucesso','são cristóvão','ilha do governador','parada de lucas','vigário geral','cordovil','brás de pina','marechal hermes','bento ribeiro','osvaldo cruz','guadalupe','costa barros','pavuna','anchieta','ricardo de albuquerque','cavalcanti','rocha miranda','lins de vasconcelos','campinho','del castilho','inhaúma','centro','estácio','rio comprido','santa teresa','lapa','glória'];
    const sul = ['copacabana','ipanema','leblon','botafogo','flamengo','laranjeiras','cosme velho','humaitá','urca','leme','gávea','jardim botânico','lagoa','são conrado','catete'];

    for (const b of oeste) if (lower.includes(b)) return 'Oeste';
    for (const b of norte) if (lower.includes(b)) return 'Norte';
    for (const b of sul) if (lower.includes(b)) return 'Sul';
    return 'Geral';
}

async function getAccessToken(): Promise<string> {
    console.log('🔑 Getting ML access token via Client Credentials...');
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: ML_APP_ID,
            client_secret: ML_SECRET,
        }),
    });

    const data = await res.json();
    if (!data.access_token) {
        console.error('❌ Failed to get token:', data);
        throw new Error('Could not get ML access token');
    }
    console.log(`   ✅ Token obtained (expires in ${data.expires_in}s)\n`);
    return data.access_token;
}

async function searchML(token: string, offset: number = 0): Promise<any> {
    // MLB1459 = Imóveis category
    // state TUxCUFJJT085N2E4 = Rio de Janeiro
    const url = `https://api.mercadolibre.com/sites/MLB/search?category=MLB1459&state=TUxCUFJJT085N2E4&price=*-1000&offset=${offset}&limit=50&sort=date_desc`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    });

    return res.json();
}

async function scrapeML() {
    console.log('🔍 Starting Mercado Livre Imóveis scraper...\n');

    let properties: Property[] = [];
    try {
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf-8');
            if (raw.trim()) properties = JSON.parse(raw);
        }
    } catch (e) {
        console.error('Could not read existing data.', e);
    }

    // Remove old ML listings (older than 3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    properties = properties.filter(p => p.source !== 'mercadolivre' || p.found_at > threeDaysAgo);

    const existingIds = new Set(properties.map(p => p.id));

    let token: string;
    try {
        token = await getAccessToken();
    } catch (e) {
        console.error('❌ Cannot proceed without token.');
        return;
    }

    let totalNew = 0;
    const MAX_PAGES = 10;

    for (let page = 0; page < MAX_PAGES; page++) {
        const offset = page * 50;
        console.log(`   📄 Page ${page + 1}/${MAX_PAGES} (offset=${offset})...`);

        try {
            const data = await searchML(token, offset);

            if (data.error) {
                console.log(`   ❌ API error: ${data.message || data.error}`);
                break;
            }

            const results = data.results || [];
            if (results.length === 0) {
                console.log(`   ⚠️ No more results.`);
                break;
            }

            let pageNew = 0;

            for (const item of results) {
                const id = `ml-${item.id}`;
                if (existingIds.has(id)) continue;

                const price = item.price || 0;
                if (price <= 0 || price > 1000) continue;

                // Extract attributes
                const attrs = item.attributes || [];
                const getAttr = (id: string): string => {
                    const a = attrs.find((a: any) => a.id === id);
                    return a?.value_name || '';
                };

                const rooms = parseInt(getAttr('BEDROOMS') || '0', 10) || 0;
                const bathrooms = parseInt(getAttr('FULL_BATHROOMS') || '0', 10) || 0;
                const area = parseInt(getAttr('COVERED_AREA')?.replace(/[^\d]/g, '') || getAttr('TOTAL_AREA')?.replace(/[^\d]/g, '') || '0', 10) || 0;

                // Location
                const loc = item.location || {};
                const neighborhood = loc.neighborhood?.name || '';
                const city = loc.city?.name || '';
                const state = loc.state?.name || '';
                const locationStr = [neighborhood, city].filter(Boolean).join(', ');

                // Image
                const image = item.thumbnail?.replace('http://', 'https://') || '';

                // Zone
                const zone = classifyZone(locationStr);

                const property: Property = {
                    id,
                    title: item.title || '',
                    price,
                    condominio: 0,
                    url: item.permalink || `https://www.mercadolivre.com.br/p/${item.id}`,
                    image,
                    rooms,
                    bathrooms,
                    area,
                    location: locationStr,
                    neighborhood,
                    zone,
                    description: '',
                    source: 'mercadolivre',
                    directOwner: false,
                    found_at: new Date().toISOString(),
                };

                properties.push(property);
                existingIds.add(id);
                pageNew++;
            }

            console.log(`   ✅ +${pageNew} new (${results.length} returned, total available: ${data.paging?.total || '?'})`);
            totalNew += pageNew;

            // Small delay to respect rate limits
            await new Promise(r => setTimeout(r, 300));

        } catch (e: any) {
            console.log(`   ❌ Page ${page + 1} error: ${e.message}`);
            break;
        }
    }

    // Save
    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2), 'utf-8');
    console.log(`\n🏁 Finished Mercado Livre. Added ${totalNew} new. Total: ${properties.length}\n`);
}

scrapeML();
