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

// Cache memory as a fast path
const memoryCache = new Map<string, GeocodeResult>();

export async function geocodeLocation(location: string, neighborhoodFallback?: string, landmarkHint?: string): Promise<GeocodeResult | null> {
    if (!location) return null;

    // Build cache key that considers landmark
    const queryKey = `${landmarkHint ? landmarkHint + '|' : ''}${location}`;
    
    // 1. Check in-memory cache first
    if (memoryCache.has(queryKey)) {
        return memoryCache.get(queryKey)!;
    }

    // 2. Check Supabase Cache
    try {
        const { data, error } = await supabase
            .from('geocode_cache')
            .select('*')
            .eq('query', queryKey)
            .single();
            
        if (data) {
            const result = { lat: data.lat, lng: data.lng, precision: data.precision || 'location' };
            memoryCache.set(queryKey, result);
            return result;
        }
    } catch (err) {
        console.error('Failed to check geocode_cache', err);
    }

    // Prepare queries
    const queriesToTry: { query: string, precision: any }[] = [];

    // Prioridade 1: Landmark + Bairro (ex: "Park Shopping, Campo Grande, Rio de Janeiro")
    if (landmarkHint && neighborhoodFallback) {
        queriesToTry.push({ 
            query: `${landmarkHint}, ${neighborhoodFallback}, Rio de Janeiro, Brasil`,
            precision: 'landmark'
        });
    }

    // Prioridade 2: Location exata fornecida pelo scraper
    queriesToTry.push({ query: location, precision: 'location' });

    // Prioridade 3: Fallback para o Bairro
    if (neighborhoodFallback) {
        queriesToTry.push({ 
            query: `${neighborhoodFallback}, Rio de Janeiro, Brasil`, 
            precision: 'neighborhood' 
        });
    }

    for (const { query, precision } of queriesToTry) {
        try {
            console.log(`🌍 Geocoding API miss for: "${query}" - Fetching from OSM...`);
            
            // Be nice to Nominatim (1 request per second)
            await new Promise(resolve => setTimeout(resolve, 1200));

            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                headers: {
                    'User-Agent': 'HouseSearcherBot/1.0 (contato@vcampos.dev)'
                }
            });

            if (!response.ok) {
                console.error(`Nominatim API returned ${response.status} for ${query}`);
                continue;
            }

            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    precision
                };

                // Save to Memory
                memoryCache.set(queryKey, result);

                // Save to Supabase Cache
                try {
                    await supabase.from('geocode_cache').insert({
                        query: queryKey,
                        lat: result.lat,
                        lng: result.lng,
                        precision: precision
                    });
                } catch (e) { }

                return result;
            } else {
                if (precision === 'landmark') {
                    console.log(`⚠️ Falha ao geolocalizar ponto de referência. Tentando location original: ${landmarkHint}`);
                } else if (precision === 'location') {
                    console.log(`⚠️ Falha ao geolocalizar rua. Tentando fallback para o bairro: ${neighborhoodFallback}`);
                }
            }
        } catch (e) {
            console.error(`Geocoding error for ${query}`, e);
        }
    }

    return null;
}
