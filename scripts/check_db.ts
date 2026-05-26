import { supabase } from '../src/lib/supabase';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function check() {
    const { data, error } = await supabase
        .from('properties')
        .select('title, description')
        .ilike('title', '%Terreno%')
        .limit(10);
        
    console.log("Terrenos no DB:", data);
}

check();
