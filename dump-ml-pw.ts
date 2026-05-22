const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
chromium.use(stealth());
const fs = require('fs');

async function dump() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://lista.mercadolivre.com.br/imoveis/aluguel/rio-de-janeiro/rio-de-janeiro/_PriceRange_0-1000_NoIndex_True');
    const card = await page.$('.ui-search-layout__item');
    if (card) {
        fs.writeFileSync('card.html', await card.innerHTML(), 'utf8');
        console.log('Saved card.html');
    } else {
        console.log('no card');
    }
    await browser.close();
}
dump();
