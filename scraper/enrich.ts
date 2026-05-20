import fs from 'fs';
import path from 'path';
import type { Property } from './index';

const dataPath = path.resolve('src/data/properties.json');

// ============================================================
// MASSIVE ZONE DATABASE — RJ Metropolitan Area
// ============================================================

const ZONES: Record<string, string[]> = {
    'Oeste': [
        'bangu', 'campo grande', 'santa cruz', 'barra da tijuca', 'barra', 'recreio',
        'recreio dos bandeirantes', 'jacarepaguá', 'taquara', 'anil', 'curicica',
        'pechincha', 'praça seca', 'realengo', 'padre miguel', 'magalhães bastos',
        'sulacap', 'guaratiba', 'senador camará', 'paciência', 'santíssimo', 'cosmos',
        'sepetiba', 'vargem grande', 'vargem pequena', 'itanhangá', 'gardênia azul',
        'vila valqueire', 'tanque', 'campo dos afonsos', 'camorim', 'grumari', 'joá',
        'pedra de guaratiba', 'barra de guaratiba', 'jardim sulacap', 'vila militar',
        'deodoro', 'gericinó', 'mendanha', 'senador vasconcelos', 'inhoaíba',
        'augusto vasconcelos', 'freguesia (jacarepaguá)', 'rio das pedras',
        'cidade de deus', 'frederico', 'jabour', 'mato alto',
    ],
    'Norte': [
        'tijuca', 'méier', 'madureira', 'penha', 'bonsucesso', 'vila isabel',
        'grajaú', 'maracanã', 'são cristóvão', 'irajá', 'pavuna', 'cascadura',
        'engenho novo', 'engenho de dentro', 'engenho da rainha',
        'marechal hermes', 'guadalupe', 'coelho neto', 'anchieta', 'vigário geral',
        'ricardo de albuquerque', 'ramos', 'olaria', 'lins de vasconcelos',
        'brás de pina', 'vicente de carvalho', 'cachambi', 'honório gurgel',
        'jacaré', 'rocha miranda', 'bento ribeiro', 'tomás coelho',
        'encantado', 'vaz lobo', 'vila kosmos', 'higienópolis', 'riachuelo',
        'quintino bocaiúva', 'turiaçu', 'colégio', 'campinho', 'oswaldo cruz',
        'tauá', 'ilha do governador', 'ribeira', 'zumbi', 'cocotá',
        'praia da bandeira', 'freguesia (ilha do governador)', 'bancários',
        'jardim guanabara', 'portuguesa', 'pitangueiras', 'galeão',
        'jardim carioca', 'cacuia', 'moneró', 'penha circular',
        'complexo do alemão', 'costa barros', 'barros filho', 'acari',
        'parque anchieta', 'jardim américa', 'del castilho', 'inhaúma',
        'abolição', 'piedade', 'pilares', 'todos os santos', 'água santa',
        'rocha', 'sampaio', 'são francisco xavier', 'benfica', 'manguinhos',
        'cordovil', 'parada de lucas', 'vista alegre', 'vila da penha',
        'jacarezinho', 'mangueira', 'praça da bandeira', 'cavalcanti',
        'engenheiro leal', 'turiaçu', 'magalhães bastos', 'colégio',
        'jardim sulacap', 'vila militar', 'deodoro', 'marechal hermes',
    ],
    'Sul': [
        'copacabana', 'ipanema', 'leblon', 'botafogo', 'flamengo', 'catete',
        'laranjeiras', 'glória', 'leme', 'gávea', 'jardim botânico',
        'humaitá', 'urca', 'cosme velho', 'lagoa', 'vidigal', 'rocinha',
        'são conrado', 'alto da boa vista',
    ],
    'Centro': [
        'centro', 'lapa', 'cidade nova', 'gamboa', 'saúde', 'fátima',
        'catumbi', 'santo cristo', 'rio comprido', 'santa teresa', 'estácio',
        'paquetá', 'caju',
    ],
    'Niterói': [
        'santa rosa', 'itaipu', 'são francisco', 'engenhoca', 'maravista',
        'fonseca', 'icaraí', 'ingá', 'boa viagem', 'charitas', 'piratininga',
        'camboinhas', 'pendotiba', 'barreto', 'são lourenço', 'vital brazil',
        'largo da batalha', 'serra grande', 'cantagalo', 'maria paula',
    ],
    'São Gonçalo': [
        'zé garoto', 'alcântara', 'rocha', 'itaúna', 'parada 40',
        'brasilândia', 'mutuaguaçu', 'mutuá', 'arsenal', 'venda da cruz',
        'jardim catarina', 'porto da pedra', 'colubande', 'porto da madama',
        'maria paula', 'neves', 'mutondo', 'santa isabel', 'pita', 'laranjal',
        'monjolos', 'tribobó', 'marambaia', 'trindade', 'vista alegre',
        'barro vermelho', 'boa vista', 'amendoeira',
    ],
    'Baixada': [
        // Duque de Caxias
        'vila centenário', 'vila santo antônio', 'xerém', 'jardim vinte e cinco de agosto',
        'jardim primavera', 'parque guararapes', 'jardim gramacho', 'sarapuí',
        'campos elíseos', 'centenário', 'caxias', 'imbariê', 'santa lucia',
        // Nova Iguaçu
        'miguel couto', 'ouro verde', 'ipiranga', 'vila são domingos',
        'comendador soares', 'austin', 'cabuçu', 'posse',
        // Belford Roxo
        'vale do ipê', 'heliópolis', 'nova aurora', 'lote xv',
        // Nilópolis
        'olinda', 'cabuis', 'nova cidade',
        // São João de Meriti
        'vilar dos teles', 'éden', 'jardim metrópole',
        // Mesquita
        'edson passos', 'chatuba', 'banco de areia',
        // Outros
        'chaperó', 'monte verde', 'manilha', 'itaboraí', 'queimados',
        'japeri', 'seropédica', 'paracambi', 'magé', 'guapimirim',
        'rio bonito', 'saracuruna',
    ],
    'Maricá': [
        'cajueiros', 'itaipuaçu', 'itaocaia valley', 'ponta negra',
        'jardim interlagos', 'inoã', 'centro maricá', 'barra de maricá',
    ],
    'Serrana': [
        'alto', 'pessegueiros', 'teresópolis', 'petrópolis', 'itaipava',
        'corrêas', 'quitandinha',
    ],
};

// City keywords to zone mapping
const CITY_ZONES: Record<string, string> = {
    'niterói': 'Niterói',
    'são gonçalo': 'São Gonçalo',
    'duque de caxias': 'Baixada',
    'nova iguaçu': 'Baixada',
    'são joão de meriti': 'Baixada',
    'belford roxo': 'Baixada',
    'nilópolis': 'Baixada',
    'mesquita': 'Baixada',
    'itaboraí': 'Baixada',
    'itaguaí': 'Baixada',
    'magé': 'Baixada',
    'queimados': 'Baixada',
    'japeri': 'Baixada',
    'seropédica': 'Baixada',
    'paracambi': 'Baixada',
    'guapimirim': 'Baixada',
    'maricá': 'Maricá',
    'teresópolis': 'Serrana',
    'petrópolis': 'Serrana',
    'mangaratiba': 'Costa Verde',
    'angra dos reis': 'Costa Verde',
};

function tryClassify(property: Property): string {
    const neighborhood = property.neighborhood.toLowerCase();
    const location = property.location.toLowerCase();
    const url = property.url.toLowerCase();
    const description = property.description.toLowerCase();
    const allText = `${neighborhood} ${location} ${url} ${description}`;

    // 1. Check URL for zone hints (ZAP/VivaReal URLs have zona-oeste, zona-norte etc.)
    if (url.includes('zona-oeste')) return 'Oeste';
    if (url.includes('zona-norte')) return 'Norte';
    if (url.includes('zona-sul')) return 'Sul';
    if (url.includes('zona-central')) return 'Centro';

    // 2. Check city in location text
    for (const [cityKey, zone] of Object.entries(CITY_ZONES)) {
        if (location.includes(cityKey)) return zone;
    }

    // 3. Match neighborhood against comprehensive database
    for (const [zone, neighborhoods] of Object.entries(ZONES)) {
        for (const bairro of neighborhoods) {
            // Exact match first
            if (neighborhood === bairro) return zone;
            // Then partial match
            if (neighborhood.includes(bairro) || bairro.includes(neighborhood)) return zone;
        }
    }

    // 4. Search in description/URL for neighborhood clues
    for (const [zone, neighborhoods] of Object.entries(ZONES)) {
        for (const bairro of neighborhoods) {
            if (allText.includes(bairro)) return zone;
        }
    }

    return 'Geral';
}

// ============================================================
// RUN ENRICHMENT
// ============================================================

function run() {
    console.log('🔧 Starting zone enrichment script...\n');

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const properties: Property[] = JSON.parse(rawData);

    let fixed = 0;
    let stillGeral = 0;
    const unfixed: string[] = [];

    for (const p of properties) {
        if (p.zone === 'Geral') {
            const newZone = tryClassify(p);
            if (newZone !== 'Geral') {
                console.log(`   ✅ "${p.neighborhood}" → ${newZone} (was Geral)`);
                p.zone = newZone;
                fixed++;
            } else {
                stillGeral++;
                if (!unfixed.includes(p.neighborhood)) {
                    unfixed.push(p.neighborhood);
                }
            }
        }
    }

    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2));
    
    console.log(`\n🏁 Enrichment complete!`);
    console.log(`   ✅ Fixed: ${fixed} properties`);
    console.log(`   ⚠️  Still "Geral": ${stillGeral} properties`);
    if (unfixed.length > 0) {
        console.log(`\n   Unclassified neighborhoods:`);
        unfixed.forEach(n => console.log(`      - "${n}"`));
    }
}

run();
