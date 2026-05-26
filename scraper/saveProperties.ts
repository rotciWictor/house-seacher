import { supabase } from '../src/lib/supabase';
import { isCommercial, isForSale, recoverNeighborhood, reclassifyZone, extractLocationHint } from '../src/utils/normalize';
import { geocodeLocation } from '../src/utils/geocoding';
import { cleanAddress } from '../src/utils/nlpEngine';

export async function saveProperties(newProperties: any[], sourceName: string) {
    console.log(`\n💾 Salvando ${newProperties.length} imóveis de ${sourceName}...`);
    
    // 1. Filtrar comerciais e vendas, normalizar bairros e reclassificar zona (AP4 -> Sudoeste)
    const validProperties = newProperties.filter(p => {
        if (isCommercial(p.title, p.description)) {
            console.log(`   🚫 Ignorado (Comercial): ${p.title.substring(0, 40)}...`);
            return false;
        }
        if (isForSale(p.title, p.description)) {
            console.log(`   🚫 Ignorado (Venda): ${p.title.substring(0, 40)}...`);
            return false;
        }
        return true;
    }).map(p => {
        const normNeighborhood = recoverNeighborhood(p.neighborhood, p.title, p.description);
        return {
            ...p,
            neighborhood: normNeighborhood,
            zone: reclassifyZone(p.zone, normNeighborhood),
            directowner: p.directOwner, // Supabase map
        };
    });

    // Remove directOwner from Supabase payload e adiciona geocoding
    const supabasePayload = [];
    console.log(`   🌍 Geolocalizando ${validProperties.length} imóveis residenciais...`);
    for (const p of validProperties) {
        const copy = { ...p };
        delete copy.directOwner;
        
        // Extrair dicas de ruas ou pontos de referência do título/descrição/localização (Agora via IA + Regex)
        const landmarkHint = await extractLocationHint(p.title, p.description, p.location) || undefined;
        
        // Limpar lixo do endereço (Libpostal ou Regex)
        const cleanedLocation = await cleanAddress(copy.location);
        copy.location = cleanedLocation; // Atualiza com a string limpa!

        // Tentamos geolocalizar pela location completa, com fallback para o bairro normalizado
        const geo = await geocodeLocation(cleanedLocation, copy.neighborhood, landmarkHint);
        if (geo) {
            copy.lat = geo.lat;
            copy.lng = geo.lng;
            copy.precision = geo.precision;
            
            // Spiderfy Fix (Jitter Espacial)
            // Se o portal não forneceu rua, espalhamos o pino em ~150m num raio aleatório
            if (geo.precision === 'neighborhood' || geo.precision === 'city') {
                const latJitter = (Math.random() - 0.5) * 0.0027; // +/- 150m
                const lngJitter = (Math.random() - 0.5) * 0.0027;
                copy.lat += latJitter;
                copy.lng += lngJitter;
            }
            
            // Auto-aprendizado: Se o landmarkHint funcionou e é de alta precisão (landmark), salva no Supabase
            if (landmarkHint && geo.precision === 'landmark') {
                try {
                    await supabase.from('learned_landmarks').insert({
                        name: landmarkHint,
                        entity_type: 'landmark'
                    });
                } catch (e) {
                    // Ignora erro de duplicidade se já existir
                }
            }
        }

        supabasePayload.push(copy);
    }

    // 2. Salvar no Supabase
    if (supabasePayload.length > 0) {
        console.log(`   ☁️ Enviando ${supabasePayload.length} imóveis residenciais para o Supabase...`);
        const batchSize = 100;
        let successCount = 0;
        for (let i = 0; i < supabasePayload.length; i += batchSize) {
            const batch = supabasePayload.slice(i, i + batchSize);
            const { error } = await supabase.from('properties').upsert(batch, { onConflict: 'id' });
            if (error) {
                console.error(`   ❌ Erro Supabase:`, error.message);
            } else {
                successCount += batch.length;
            }
        }
        console.log(`   ✅ Supabase: ${successCount} salvos/atualizados.`);
    }

}
