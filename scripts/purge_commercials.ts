import { supabase } from '../src/lib/supabase';
import { isCommercial, isForSale } from '../src/utils/normalize';

async function purge() {
    console.log('Fetching all properties from Supabase...');
    // We need to fetch in pages if there are many, but for now let's just get all
    const { data, error } = await supabase.from('properties').select('id, title, description, url');
    
    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    if (!data) return;

    let toDelete = [];
    console.log(`Checking ${data.length} properties...`);

    for (const p of data) {
        if (isCommercial(p.title || '', p.description || '')) {
            console.log(`🗑️ LIXO COMERCIAL: ${p.title} (${p.url})`);
            toDelete.push(p.id);
            continue;
        }
        
        if (isForSale(p.title || '', p.description || '')) {
            console.log(`🗑️ LIXO DE VENDA: ${p.title} (${p.url})`);
            toDelete.push(p.id);
            continue;
        }
    }

    console.log(`\nFound ${toDelete.length} garbage properties to delete.`);

    if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from('properties')
            .delete()
            .in('id', toDelete);
            
        if (deleteError) {
            console.error('Failed to delete:', deleteError);
        } else {
            console.log(`✅ Successfully deleted ${toDelete.length} properties from Supabase.`);
        }
    } else {
        console.log('Database is clean!');
    }
}

purge().catch(console.error);
