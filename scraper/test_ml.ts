import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

chromium.use(stealth());

async function test() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Acessar a lista
    await page.goto('https://lista.mercadolivre.com.br/imoveis/aluguel/rio-de-janeiro/rio-de-janeiro/_PriceRange_0-1000_NoIndex_True', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    await page.waitForSelector('a.poly-component__title', { timeout: 15000 });
    const link = await page.$eval('a.poly-component__title', el => (el as HTMLAnchorElement).href);
    console.log('Testando anúncio ML:', link);

    await page.goto(link, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Dar tempo
    
    const data = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        let desc = '';
        let title = document.querySelector('h1')?.textContent || '';
        
        for (const s of scripts) {
            try {
                const j = JSON.parse(s.textContent || '{}');
                if (j['@type'] === 'Product' || j['@type'] === 'Apartment' || j.description) {
                    desc = j.description || desc;
                    if (!title) title = j.name;
                }
            } catch (e) {}
        }
        
        // Fallback description from DOM if ld+json is empty
        if (!desc) {
            const descEl = document.querySelector('.ui-pdp-description__content');
            if (descEl) desc = descEl.textContent || '';
        }
        
        return {
            title,
            desc,
            hasPassoPonto: desc.toLowerCase().includes('passo ponto'),
            hasVenda: desc.toLowerCase().includes('venda'),
            hasComercial: desc.toLowerCase().includes('comercial')
        };
    });

    console.log(JSON.stringify(data, null, 2));
    await browser.close();
}

test().catch(console.error);
