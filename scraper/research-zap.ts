import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    console.log("Navigating to ZAP...");
    await page.goto('https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel&pagina=1', { waitUntil: 'domcontentloaded' });
    
    // Check for NEXT_DATA or Apollo
    const data = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent || '');
        const inlineScripts = scripts.filter(s => s.length > 100);
        
        const windowKeys = Object.keys(window).filter(k => k.startsWith('__') || k.includes('STATE') || k.includes('DATA'));
        
        return {
            windowKeys,
            scriptSamples: inlineScripts.map(s => s.substring(0, 100))
        };
    });
    
    console.log("Data found on ZAP:", data);
    await browser.close();
}

run().catch(console.error);
