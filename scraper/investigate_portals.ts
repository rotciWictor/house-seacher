import { chromium } from 'playwright';
import fs from 'fs';

async function investigate() {
    console.log('🚀 Iniciando investigação dos 5 portais (Toda a primeira página)...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const results: any = {};

    // 1. ZAP Imóveis
    try {
        console.log('Pesquisando ZAP...');
        const page = await context.newPage();
        await page.goto('https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const nextDataRaw = await page.evaluate(() => document.getElementById('__NEXT_DATA__')?.innerText);
        const nextData = nextDataRaw ? JSON.parse(nextDataRaw) : null;
        
        // Vamos extrair os endereços que vieram no NextData pra ver se são completos!
        const zapAddresses = nextData?.props?.pageProps?.initialState?.search?.result?.listings?.map((l: any) => l.listing?.address) || [];
        
        results.zap = {
            total_cards: zapAddresses.length,
            addresses_from_json: zapAddresses.map((a: any) => ({
                street: a.street,
                neighborhood: a.neighborhood,
                city: a.city,
                point: a.point
            }))
        };
        await page.close();
    } catch (e) { console.error('ZAP falhou:', e); }

    // 2. VivaReal
    try {
        console.log('Pesquisando VivaReal...');
        const page = await context.newPage();
        await page.goto('https://www.vivareal.com.br/aluguel/rj/rio-de-janeiro/#onde=,Rio%20de%20Janeiro,Rio%20de%20Janeiro,,,,,city,BR%3ERio%20de%20Janeiro%3ENULL%3ERio%20de%20Janeiro,-22.9068467,-43.1728965,&preco-ate=1000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const nextDataRaw = await page.evaluate(() => document.getElementById('__NEXT_DATA__')?.innerText);
        const nextData = nextDataRaw ? JSON.parse(nextDataRaw) : null;
        
        const vrAddresses = nextData?.props?.pageProps?.initialState?.search?.result?.listings?.map((l: any) => l.listing?.address) || [];
        
        results.vivareal = {
            total_cards: vrAddresses.length,
            addresses_from_json: vrAddresses.map((a: any) => ({
                street: a.street,
                neighborhood: a.neighborhood,
                city: a.city,
                point: a.point
            }))
        };
        await page.close();
    } catch (e) { console.error('VivaReal falhou:', e); }

    // 3. Mercado Livre
    try {
        console.log('Pesquisando Mercado Livre...');
        const page = await context.newPage();
        await page.goto('https://imoveis.mercadolivre.com.br/apartamentos/aluguel/rio-de-janeiro/rio-de-janeiro/_PriceRange_0-1000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const mlLocations = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.poly-component__location')).map(el => (el as HTMLElement).innerText);
        });
        
        const preloadedStateRaw = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const stateScript = scripts.find(s => s.innerText.includes('window.__PRELOADED_STATE__'));
            return stateScript ? stateScript.innerText : null;
        });
        
        results.mercadolivre = {
            total_cards: mlLocations.length,
            dom_locations: mlLocations,
            has_preloaded_state: !!preloadedStateRaw
        };
        await page.close();
    } catch (e) { console.error('ML falhou:', e); }

    // 4. OLX
    try {
        console.log('Pesquisando OLX...');
        const page = await context.newPage();
        await page.goto('https://www.olx.com.br/imoveis/aluguel/estado-rj/rio-de-janeiro-e-regiao?pe=1000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const initialStateRaw = await page.evaluate(() => document.getElementById('initial-data')?.innerText);
        let olxAds = [];
        if (initialStateRaw) {
            const data = JSON.parse(initialStateRaw);
            olxAds = data?.adList || [];
        }
        
        results.olx = {
            total_cards: olxAds.length,
            addresses_from_json: olxAds.map((ad: any) => ({
                subject: ad.subject,
                location: ad.location
            }))
        };
        await page.close();
    } catch (e) { console.error('OLX falhou:', e); }

    // 5. Chaves na Mão
    try {
        console.log('Pesquisando Chaves na Mao...');
        const page = await context.newPage();
        await page.goto('https://www.chavesnamao.com.br/imoveis/rj-rio-de-janeiro/?precoMax=1000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const nextDataRaw = await page.evaluate(() => document.getElementById('__NEXT_DATA__')?.innerText);
        const nextData = nextDataRaw ? JSON.parse(nextDataRaw) : null;
        
        const cnmAds = nextData?.props?.pageProps?.initialState?.imoveis?.imoveis || [];
        
        results.chavesnamao = {
            total_cards: cnmAds.length,
            addresses_from_json: cnmAds.map((ad: any) => ({
                rua: ad.endereco?.rua,
                bairro: ad.endereco?.bairro,
                cidade: ad.endereco?.cidade,
                numero: ad.endereco?.numero
            }))
        };
        await page.close();
    } catch (e) { console.error('Chaves na Mao falhou:', e); }

    fs.writeFileSync('C:/Users/Administrador/.gemini/antigravity/brain/16722cef-a6d8-4775-8152-b10ef0fd3809/scratch/portal_addresses_investigation.json', JSON.stringify(results, null, 2));
    await browser.close();
    console.log('✅ Investigação de páginas inteiras concluída e salva!');
}

investigate();
