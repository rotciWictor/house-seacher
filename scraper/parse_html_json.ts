import fs from 'fs';
import cheerio from 'cheerio';

const files = [
    'zap_full.html',
    'vivareal_full.html',
    'olx_full.html',
    'cnm_full.html'
];

for (const file of files) {
    const path = `C:/Users/Administrador/.gemini/antigravity/brain/16722cef-a6d8-4775-8152-b10ef0fd3809/scratch/${file}`;
    if (!fs.existsSync(path)) continue;
    
    console.log(`\n=================== ${file} ===================`);
    const html = fs.readFileSync(path, 'utf-8');
    const $ = cheerio.load(html);
    
    let found = false;
    $('script').each((i, el) => {
        const text = $(el).html() || '';
        
        // ZAP / VivaReal generally use window.__PRELOADED_STATE__ or __NEXT_DATA__
        if (text.includes('__NEXT_DATA__') || text.includes('__PRELOADED_STATE__') || text.includes('initial-data') || text.includes('__initialData__')) {
            console.log(`Found possible state script of length ${text.length}`);
            
            // Try to extract some addresses just to prove they exist
            if (text.includes('street') || text.includes('rua') || text.includes('address')) {
                console.log(`✅ HAS ADDRESS FIELDS! (street/rua/address found)`);
                // Let's print a tiny snippet around the word 'street'
                const match = text.match(/.{0,50}street.{0,50}/i);
                if (match) console.log(`Snippet: ${match[0]}`);
                found = true;
            }
        }
    });
    
    if (!found) {
        console.log(`❌ No deep JSON state containing addresses found.`);
    }
}
