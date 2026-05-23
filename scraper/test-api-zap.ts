import * as fs from 'fs';

async function run() {
    const url = 'https://glue-api.zapimoveis.com.br/v2/listings?business=RENTAL&parentId=null&listingType=USED&images=webp&categoryPage=RESULT&portal=ZAP&priceMax=1000&addressCity=Rio+de+Janeiro&addressState=Rio+de+Janeiro&addressLocationId=BR%3ERio+de+Janeiro%3ENULL%3ERio+de+Janeiro&page=1&size=10&includeFields=search(result(listings(listing(id,title,description,pricingInfos,address,usableAreas,bedrooms,bathrooms))))';
    
    console.log("Fetching API directly...");
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json',
            'x-domain': 'www.zapimoveis.com.br'
        }
    });

    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Items returned:", json.search?.result?.listings?.length);
}

run().catch(console.error);
