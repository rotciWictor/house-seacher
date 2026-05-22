const { chromium } = require('playwright');
const fs = require('fs');

async function extract() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://lista.mercadolivre.com.br/imoveis/aluguel/rio-de-janeiro/rio-de-janeiro/_PriceRange_0-1000_NoIndex_True');
    
    const card = await page.$('.ui-search-layout__item');
    if (card) {
        const html = await card.innerHTML();
        fs.writeFileSync('card.html', html, 'utf8');
        console.log('Saved card.html');
    } else {
        console.log('No cards found');
    }
    await browser.close();
}
extract();
