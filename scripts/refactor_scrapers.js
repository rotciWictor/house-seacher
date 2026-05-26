const fs = require('fs');

const files = ['scraper/chavesnamao.ts', 'scraper/zap.ts', 'scraper/vivareal.ts', 'scraper/olx.ts'];

files.forEach(f => {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/import fs from 'fs';\r?\n/, '');
    text = text.replace(/import path from 'path';\r?\n/, '');
    text = text.replace(/const dataPath = path\.resolve\('src\/data\/properties\.json'\);\r?\n/, '');
    
    const sourceName = f.split('/')[1].replace('.ts', '');
    const replacement = `const { data: existingData } = await supabase.from('properties').select('id').eq('source', '${sourceName}');\n    const existingIds = new Set(existingData?.map(p => p.id) || []);\n    const newPropertiesForSupabase: Property[] = [];`;
    
    text = text.replace(/let properties: Property\[\] = \[\];[\s\S]*?const existingIds = new Set\(properties\.map\(p => p\.id\)\);/, replacement);
    
    if(!text.includes('import { supabase }')) {
        text = "import { supabase } from '../src/lib/supabase';\n" + text;
    }
    
    fs.writeFileSync(f, text);
    console.log('Updated ' + f);
});
