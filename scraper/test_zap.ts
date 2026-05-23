import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

chromium.use(stealth());

async function test() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Acessar a lista para pegar um anúncio recente e válido
    await page.goto('https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const link = await page.$eval('a[href*="/imovel/"]', el => (el as HTMLAnchorElement).href);
    console.log('Testando anúncio ZAP:', link);

    await page.goto(link, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Dar tempo para os scripts rodarem
    
    const data = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        let desc = '';
        let title = document.querySelector('h1')?.textContent || '';
        for (const s of scripts) {
            try {
                const j = JSON.parse(s.textContent || '{}');
                if (j['@type'] === 'Product' || j['@type'] === 'Apartment' || j['@type'] === 'House' || j.description) {
                    desc = j.description || desc;
                    if (!title) title = j.name;
                }
            } catch (e) {}
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
