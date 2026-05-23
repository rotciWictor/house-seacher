import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

async function run() {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    const page = await context.newPage();

    page.on('request', r => {
        if (r.url().includes('listings')) {
            console.log('REQ:', r.method(), r.url());
        }
    });

    console.log("Acessando...");
    await page.goto('https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel');
    
    await page.waitForTimeout(5000);
    console.log("Scrolling...");
    await page.evaluate(() => window.scrollBy(0, 5000));
    
    await page.waitForTimeout(2000);
    console.log("Clicking Next...");
    await page.evaluate(() => {
        const nextBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent?.includes('Próxima'));
        if (nextBtn) (nextBtn as HTMLElement).click();
    });
    
    await page.waitForTimeout(5000);
    await browser.close();
}

run().catch(console.error);
