import { supabase } from '../src/lib/supabase';
import { isCommercial, isForSale, recoverNeighborhood, reclassifyZone } from '../src/utils/normalize';

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

    // Remove directOwner from Supabase payload
    const supabasePayload = validProperties.map(p => {
        const copy = { ...p };
        delete copy.directOwner;
        return copy;
    });

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
