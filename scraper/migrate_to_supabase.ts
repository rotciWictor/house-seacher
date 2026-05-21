import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Usar dotenv para pegar variáveis locais se rodar no CLI
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase keys not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const dataPath = path.resolve(process.cwd(), 'src/data/properties.json');

async function migrate() {
    console.log('🚀 Iniciando migração para o Supabase...');
    
    if (!fs.existsSync(dataPath)) {
        console.error('properties.json não encontrado!');
        return;
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const properties = JSON.parse(raw);
    console.log(`Lidos ${properties.length} imóveis do JSON local.`);

    // Migrar em lotes de 100 para não sobrecarregar a API
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize).map((p: any) => ({
            ...p,
            directowner: p.directOwner
        }));
        // Remove the old directOwner key to avoid Supabase errors
        batch.forEach((p: any) => delete p.directOwner);
        
        console.log(`Enviando lote ${i} a ${i + batch.length}...`);
        
        const { data, error } = await supabase
            .from('properties')
            .upsert(batch, { onConflict: 'id' });
            
        if (error) {
            console.error('❌ Erro ao enviar lote:', error);
            // Parar a migração se der erro
            break;
        } else {
            successCount += batch.length;
        }
    }
    
    console.log(`✅ Migração concluída! ${successCount} imóveis inseridos no Supabase.`);
}

migrate();
