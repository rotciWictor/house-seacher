import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';

chromium.use(stealth());

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    console.log("Navigating to ZAP...");
    await page.goto('https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel&pagina=1', { waitUntil: 'domcontentloaded' });
    
    const data = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.textContent || '');
        return scripts;
    });
    
    fs.writeFileSync('zap-jsonld.json', JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} JSON-LD scripts to zap-jsonld.json`);
    await browser.close();
}

run().catch(console.error);
