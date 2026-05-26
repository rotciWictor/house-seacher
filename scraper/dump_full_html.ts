import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

chromium.use(stealth());

async function dumpPortals() {
    console.log('🚀 Iniciando extração de HTML dos portais...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    // 1. ZAP
    try {
        console.log('Extraindo ZAP...');
        const page = await context.newPage();
        await page.goto('https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(4000);
        fs.writeFileSync('C:/Users/Administrador/.gemini/antigravity/brain/16722cef-a6d8-4775-8152-b10ef0fd3809/scratch/zap_full.html', await page.content());
        await page.close();
    } catch (e) { console.error('ZAP falhou'); }

    // 2. VivaReal
    try {
        console.log('Extraindo VivaReal...');
        const page = await context.newPage();
        await page.goto('https://www.vivareal.com.br/aluguel/rj/rio-de-janeiro/?preco-ate=1000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(4000);
        fs.writeFileSync('C:/Users/Administrador/.gemini/antigravity/brain/16722cef-a6d8-4775-8152-b10ef0fd3809/scratch/vivareal_full.html', await page.content());
        await page.close();
    } catch (e) { console.error('VivaReal falhou'); }

    // 3. OLX
    try {
        console.log('Extraindo OLX...');
        const page = await context.newPage();
        await page.goto('https://www.olx.com.br/imoveis/aluguel/estado-rj/rio-de-janeiro-e-regiao', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(4000);
        fs.writeFileSync('C:/Users/Administrador/.gemini/antigravity/brain/16722cef-a6d8-4775-8152-b10ef0fd3809/scratch/olx_full.html', await page.content());
        await page.close();
    } catch (e) { console.error('OLX falhou'); }

    // 4. Chaves na Mão
    try {
        console.log('Extraindo Chaves na Mao...');
        const page = await context.newPage();
        await page.goto('https://www.chavesnamao.com.br/imoveis/rj-rio-de-janeiro/?precoMax=1000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(4000);
        fs.writeFileSync('C:/Users/Administrador/.gemini/antigravity/brain/16722cef-a6d8-4775-8152-b10ef0fd3809/scratch/cnm_full.html', await page.content());
        await page.close();
    } catch (e) { console.error('CNM falhou'); }

    await browser.close();
    console.log('✅ Tudo finalizado. Verifique a pasta scratch.');
}

dumpPortals();
