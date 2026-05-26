import { supabase } from './src/lib/supabase';
import fs from 'fs';

async function fetchLocations() {
    const { data, error } = await supabase
        .from('properties')
        .select('location, source, neighborhood')
        .neq('location', '')
        .limit(100);

    if (error) {
        console.error("Error fetching properties:", error);
        return;
    }

    // Pega strings únicas e mais compridas, possivelmente mais sujas
    const uniqueLocations = Array.from(new Set(data.map(d => d.location)))
        .filter(l => l.length > 20)
        .slice(0, 10); // Pega 10 exemplos bons

    fs.writeFileSync('C:/Users/Administrador/.gemini/antigravity/brain/16722cef-a6d8-4775-8152-b10ef0fd3809/scratch/db_locations.txt', uniqueLocations.join('\n'));
    console.log("Saved 10 locations to db_locations.txt:\n");
    uniqueLocations.forEach(l => console.log(l));
}

fetchLocations();
