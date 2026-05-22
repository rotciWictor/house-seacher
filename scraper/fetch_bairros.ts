import fs from 'fs';
import path from 'path';

async function fetchBairros() {
    console.log('Fetching Data.Rio Bairros...');
    const url = 'https://services1.arcgis.com/OlP4dGNtIcnD3RYf/arcgis/rest/services/Limite_de_Bairros/FeatureServer/0/query?outFields=NOME,REGIAO_ADM,AREA_PLANE&where=1%3D1&f=geojson';
    const res = await fetch(url);
    const data = await res.json();
    
    const bairros = data.features.map((f: any) => ({
        nome: f.properties.NOME,
        regiao: f.properties.REGIAO_ADM,
        zona: f.properties.AREA_PLANE
    })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

    const outputPath = path.resolve('src/data/bairros_rj.json');
    fs.writeFileSync(outputPath, JSON.stringify(bairros, null, 2));
    console.log(`Saved ${bairros.length} bairros to ${outputPath}`);
}

fetchBairros();
