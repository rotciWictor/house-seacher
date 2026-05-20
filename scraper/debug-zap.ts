import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
chromium.use(stealth());

(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // ZAP
    console.log('=== ZAP IMÓVEIS ===');
    await page.goto('https://www.zapimoveis.com.br/aluguel/imoveis/rj+rio-de-janeiro/?precoMaximo=1000&transacao=aluguel', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Find a property link and get its closest card ancestor
    const zapCard = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/imovel/"]'));
        if (links.length === 0) return 'No links found';
        
        // Get the first link's parent card
        const link = links[0] as HTMLAnchorElement;
        // Walk up to find a meaningful container
        let el: HTMLElement | null = link;
        for (let i = 0; i < 8; i++) {
            if (el?.parentElement) el = el.parentElement;
        }
        
        return {
            href: link.href,
            linkText: link.textContent?.substring(0, 100),
            cardHTML: el?.innerHTML?.substring(0, 3000),
            totalLinks: links.length,
            // Also get all unique selectors of card containers
            linkParentClasses: links.slice(0, 3).map(l => {
                let parent: HTMLElement | null = l as HTMLElement;
                const classes: string[] = [];
                for (let i = 0; i < 6; i++) {
                    if (parent?.parentElement) {
                        parent = parent.parentElement;
                        classes.push(parent.tagName + '.' + parent.className.split(' ').slice(0, 2).join('.'));
                    }
                }
                return classes;
            })
        };
    });
    console.log(JSON.stringify(zapCard, null, 2));

    // Also try to extract structured data from first card
    const zapData = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/imovel/"]'));
        return links.slice(0, 3).map(link => {
            // Find the card container (walk up until we find something with price)
            let card: HTMLElement | null = link as HTMLElement;
            for (let i = 0; i < 10; i++) {
                if (card?.parentElement) card = card.parentElement;
                if (card?.textContent?.includes('R$')) break;
            }
            
            const text = card?.textContent || '';
            const imgs = Array.from(card?.querySelectorAll('img') || []);
            const imgSrcs = imgs.map(i => i.src || i.getAttribute('data-src') || '').filter(s => s && !s.includes('data:image'));
            
            return {
                href: (link as HTMLAnchorElement).href,
                text: text.substring(0, 500),
                images: imgSrcs.slice(0, 2),
            };
        });
    });
    console.log('\n=== ZAP CARD DATA ===');
    console.log(JSON.stringify(zapData, null, 2));

    await browser.close();
})();
