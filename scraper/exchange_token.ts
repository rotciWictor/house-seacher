import fs from 'fs';

async function exchange() {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: '712797680476379',
            client_secret: 'NpBOTRf0OWlamDcIKYqDDc8uaP3o6Fdx',
            code: 'TG-6a0f932c62124700018f1747-115951490',
            redirect_uri: 'https://house-seacher.vcampos.dev/api/ml-callback'
        })
    });
    
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    
    if (data.refresh_token) {
        fs.writeFileSync('src/data/ml_token.json', JSON.stringify(data, null, 2));
        console.log('Saved to src/data/ml_token.json');
    }
}
exchange();
