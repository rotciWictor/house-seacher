import fs from 'fs';
import path from 'path';
import { supabase } from '../src/lib/supabase';
import { isCommercial, normalizeNeighborhood } from '../src/utils/normalize';

const dataPath = path.resolve(process.cwd(), 'src/data/properties.json');

export async function saveProperties(newProperties: any[], sourceName: string) {
    console.log(`\n💾 Salvando ${newProperties.length} imóveis de ${sourceName}...`);
    
    // 1. Filtrar comerciais e normalizar bairros
    const validProperties = newProperties.filter(p => {
        if (isCommercial(p.title, p.description)) {
            console.log(`   🚫 Ignorado (Comercial): ${p.title.substring(0, 40)}...`);
            return false;
        }
        return true;
    }).map(p => ({
        ...p,
        neighborhood: normalizeNeighborhood(p.neighborhood),
        directowner: p.directOwner, // Supabase map
    }));

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

    // 3. Manter o backup local (opcional, mas bom pra debug)
    let localProperties: any[] = [];
    if (fs.existsSync(dataPath)) {
        localProperties = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    
    let addedLocal = 0;
    const ids = new Set(localProperties.map(p => p.id));
    for (const p of validProperties) {
        if (!ids.has(p.id)) {
            localProperties.push(p);
            addedLocal++;
        }
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(localProperties, null, 2));
    console.log(`   📁 Backup Local: ${addedLocal} novos imóveis adicionados.`);
}
