import fs from 'fs';

const files = [
    'scraper/index.ts',
    'scraper/zap.ts',
    'scraper/mercadolivre.ts',
    'scraper/chavesnamao.ts',
    'scraper/enrich.ts'
];
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    content = content.replace(/return 'Oeste'/g, "return 'Zona Oeste'");
    content = content.replace(/return 'Sul'/g, "return 'Zona Sul'");
    content = content.replace(/return 'Norte'/g, "return 'Zona Norte'");
    
    // Also update enrich.ts ZONES and page.tsx selectedZone initial/checks
    content = content.replace(/'Oeste':/g, "'Zona Oeste':");
    content = content.replace(/'Sul':/g, "'Zona Sul':");
    content = content.replace(/'Norte':/g, "'Zona Norte':");

    if (original !== content) {
        fs.writeFileSync(f, content, 'utf8');
        console.log(`Updated ${f}`);
    }
});

// Update frontend
const pageTsx = 'src/app/page.tsx';
let page = fs.readFileSync(pageTsx, 'utf8');
page = page.replace(/'Oeste'/g, "'Zona Oeste'");
page = page.replace(/'Sul'/g, "'Zona Sul'");
page = page.replace(/'Norte'/g, "'Zona Norte'");
fs.writeFileSync(pageTsx, page, 'utf8');
console.log(`Updated frontend`);
