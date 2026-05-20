import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
chromium.use(stealth());

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.olx.com.br/imoveis/aluguel/estado-rj/rio-de-janeiro-e-regiao?pe=1000', {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('section');
    await page.waitForTimeout(3000);
    // Find the first section that has an image
    const html = await page.$$eval('section', els => {
        const ad = els.find(el => el.innerHTML.includes('imoveis/') && el.innerHTML.includes('<img'));
        return ad ? ad.innerHTML : 'Not found';
    });
    console.log(html);
    await browser.close();
})();
