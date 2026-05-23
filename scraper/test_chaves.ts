import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function test() {
    const res = await fetch('https://www.chavesnamao.com.br/imoveis-para-alugar/rj-rio-de-janeiro/?valormax=1000', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    let firstLink = $('a[href*="/imovel/"]').first().attr('href');
    
    if (firstLink) {
        if (!firstLink.startsWith('http')) firstLink = 'https://www.chavesnamao.com.br' + firstLink;
        console.log('Testing link:', firstLink);
        
        const res2 = await fetch(firstLink, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });
        const html2 = await res2.text();
        fs.writeFileSync('chaves_page.html', html2);
        console.log('Saved chaves_page.html');
    }
}

test().catch(console.error);
