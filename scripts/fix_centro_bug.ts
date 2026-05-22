import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCentroBug() {
    console.log('🔍 Buscando imóveis classificados como "Centro"...');
    const { data, error } = await supabase.from('properties').select('id, neighborhood, location, title').eq('zone', 'Centro');

    if (error) {
        console.error('Erro ao buscar:', error.message);
        return;
    }

    console.log(`Encontrados ${data.length} imóveis no "Centro".`);

    const updates = [];

    for (const p of data) {
        const text = `${p.location} ${p.neighborhood} ${p.title}`.toLowerCase();
        
        let newZone = null;
        
        if (text.includes('nilópolis') || text.includes('nilopolis') || text.includes('caxias') || text.includes('nova iguaçu') || text.includes('nova iguacu') || text.includes('belford roxo') || text.includes('são joão de meriti') || text.includes('sao joao de meriti') || text.includes('mesquita')) {
            newZone = 'Baixada';
        } else if (text.includes('niterói') || text.includes('niteroi')) {
            newZone = 'Niterói';
        } else if (text.includes('são gonçalo') || text.includes('sao goncalo')) {
            newZone = 'São Gonçalo';
        } else if (text.includes('maricá') || text.includes('marica')) {
            newZone = 'Maricá';
        }

        if (newZone) {
            console.log(`   🔧 Corrigindo: ${p.neighborhood} / ${p.location} -> ${newZone}`);
            updates.push({ id: p.id, zone: newZone });
        }
    }

    if (updates.length > 0) {
        console.log(`\n💾 Salvando ${updates.length} correções no banco...`);
        for (const u of updates) {
            const { error: upErr } = await supabase.from('properties').update({ zone: u.zone }).eq('id', u.id);
            if (upErr) console.error(`❌ Erro atualizando ${u.id}:`, upErr.message);
        }
        console.log('✅ Concluído com sucesso!');
    } else {
        console.log('Nenhum imóvel precisou ser corrigido.');
    }
}

fixCentroBug();
