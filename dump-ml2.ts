const cheerio = require('cheerio');
const fs = require('fs');

async function dump() {
    const r = await fetch('https://lista.mercadolivre.com.br/imoveis/aluguel/rio-de-janeiro/rio-de-janeiro/_PriceRange_0-1000_NoIndex_True', {
        headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    });
    const html = await r.text();
    const $ = cheerio.load(html);
    const cardHtml = $('.ui-search-layout__item').first().html() || 'no card found';
    fs.writeFileSync('ml-dump.html', cardHtml, 'utf8');
    console.log('Saved ml-dump.html');
}
dump();
