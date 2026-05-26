import { supabase } from './src/lib/supabase';
import { normalizeNeighborhood, reclassifyZone } from './src/utils/normalize';

async function clean() {
    console.log('Fetching all properties...');
    const { data, error } = await supabase.from('properties').select('id, neighborhood, zone');
    if (error) throw error;
    
    let updates = [];
    for (const p of data) {
        const cleaned = normalizeNeighborhood(p.neighborhood);
        const newZone = reclassifyZone(p.zone, cleaned);
        if (cleaned !== p.neighborhood || newZone !== p.zone) {
            updates.push({ id: p.id, neighborhood: cleaned, zone: newZone });
        }
    }
    
    console.log(`Found ${updates.length} properties to clean/reclassify...`);
    
    let success = 0;
    for (const u of updates) {
        const { error } = await supabase.from('properties').update({ neighborhood: u.neighborhood, zone: u.zone }).eq('id', u.id);
        if (error) console.error(error);
        else success++;
    }
    
    console.log(`Cleaned ${success} properties in Supabase!`);
}

clean().catch(console.error);
