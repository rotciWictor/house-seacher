import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

import fs from 'fs';

chromium.use(stealth());

async function test() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    // Acessar a lista para pegar um anúncio recente e válido
    await page.goto('https://www.olx.com.br/imoveis/aluguel/estado-rj/rio-de-janeiro-e-regiao?pe=1000', { waitUntil: 'domcontentloaded' });
    
    const link = await page.$eval('section a[href*="/imoveis/"]', el => (el as HTMLAnchorElement).href);
    console.log('Testando anúncio:', link);

    await page.goto(link, { waitUntil: 'domcontentloaded' });
    
    const dataJson = await page.$eval('#initial-data', el => el.getAttribute('data-json'));
    if (dataJson) {
        const ad = JSON.parse(dataJson).ad;
        console.log(JSON.stringify({
            title: ad.subject,
            price: ad.priceValue,
            condominio: ad.properties?.find((p: any) => p.name === 'condominio')?.value,
            iptu: ad.properties?.find((p: any) => p.name === 'iptu')?.value,
            area: ad.properties?.find((p: any) => p.name === 'size')?.value,
            rooms: ad.properties?.find((p: any) => p.name === 'rooms')?.value,
            category: ad.categoryName,
            description: ad.body,
            location: ad.location
        }, null, 2));
    }
    
    await browser.close();
}

test().catch(console.error);
