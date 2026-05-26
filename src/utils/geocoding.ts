import { supabase } from '../lib/supabase';

// Helper for waiting between API requests
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface GeocodeResult {
    lat: number;
    lng: number;
    precision: 'street' | 'neighborhood';
}

export function determinePrecision(location: string): 'street' | 'neighborhood' {
    const lowerLoc = location.toLowerCase();
    const streetKeywords = ['rua ', 'r. ', 'av ', 'av. ', 'avenida ', 'praça ', 'praca ', 'estrada ', 'rodovia ', 'travessa ', 'alameda ', 'beco ', 'vila '];
    
    for (const kw of streetKeywords) {
        if (lowerLoc.includes(kw)) {
            return 'street';
        }
    }
    
    return 'neighborhood';
}

export async function geocodeLocation(location: string, neighborhoodFallback: string): Promise<GeocodeResult | null> {
    if (!location) {
        location = neighborhoodFallback;
    }

    // Clean location string slightly to improve accuracy
    const query = `${location}, Rio de Janeiro, Brasil`.trim();
    const precision = determinePrecision(location);

    // 1. Check Supabase Cache
    try {
        const { data, error } = await supabase
            .from('geocode_cache')
            .select('*')
            .eq('query', query)
            .single();

        if (data) {
            return {
                lat: Number(data.lat),
                lng: Number(data.lng),
                precision: data.precision as 'street' | 'neighborhood'
            };
        }
    } catch (e) {
        console.error('Error checking geocode cache:', e);
    }

    // 2. Fetch from Nominatim if not cached
    console.log(`🌍 Geocoding API miss for: "${query}" - Fetching from OSM...`);
    
    try {
        // Nominatim usage policy requires 1 request per second max and a valid User-Agent
        await delay(1200); 

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'HouseSearcherBot/1.0 (contato@vcampos.dev)'
            }
        });

        if (!response.ok) {
            console.error(`Nominatim API returned ${response.status} for ${query}`);
            return null;
        }

        const json = await response.json();
        
        if (json && json.length > 0) {
            const result = json[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);

            // 3. Save to Supabase Cache
            await supabase.from('geocode_cache').insert({
                query,
                lat,
                lng,
                precision
            });

            return { lat, lng, precision };
        } else {
            // Se a busca falhou (ex: endereço muito específico e confuso),
            // tentamos o fallback recursivo usando apenas o bairro
            if (location !== neighborhoodFallback) {
                console.log(`⚠️ Falha ao geolocalizar rua. Tentando fallback para o bairro: ${neighborhoodFallback}`);
                return await geocodeLocation(neighborhoodFallback, neighborhoodFallback);
            }
            return null;
        }
    } catch (e) {
        console.error('Error fetching from Nominatim:', e);
        return null;
    }
}
