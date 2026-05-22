import fs from 'fs';
import path from 'path';
import type { Property } from './index';

const dataPath = path.resolve('src/data/properties.json');

// ============================================================
// MASSIVE ZONE DATABASE — RJ Metropolitan Area
// ============================================================

const ZONES: Record<string, string[]> = {
    'Zona Oeste': [
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
    'Zona Norte': [
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
    'Zona Sul': [
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
    'niterói': 'Niterói', 'niteroi': 'Niterói',
    'são gonçalo': 'São Gonçalo', 'sao goncalo': 'São Gonçalo',
    'duque de caxias': 'Baixada', 'caxias': 'Baixada',
    'nova iguaçu': 'Baixada', 'nova iguacu': 'Baixada',
    'são joão de meriti': 'Baixada', 'sao joao de meriti': 'Baixada',
    'belford roxo': 'Baixada',
    'nilópolis': 'Baixada', 'nilopolis': 'Baixada',
    'mesquita': 'Baixada',
    'itaboraí': 'Baixada', 'itaborai': 'Baixada',
    'itaguaí': 'Baixada', 'itaguai': 'Baixada',
    'magé': 'Baixada', 'mage': 'Baixada',
    'queimados': 'Baixada',
    'japeri': 'Baixada',
    'seropédica': 'Baixada', 'seropedica': 'Baixada',
    'paracambi': 'Baixada',
    'guapimirim': 'Baixada',
    'maricá': 'Maricá', 'marica': 'Maricá',
    'teresópolis': 'Serrana', 'teresopolis': 'Serrana',
    'petrópolis': 'Serrana', 'petropolis': 'Serrana',
    'mangaratiba': 'Costa Verde',
    'angra dos reis': 'Costa Verde', 'angra': 'Costa Verde',
};

function tryClassify(property: Property): string {
    const neighborhood = property.neighborhood.toLowerCase();
    const location = property.location.toLowerCase();
    const url = property.url.toLowerCase();
    const title = property.title.toLowerCase();
    const description = property.description.toLowerCase();
    const allText = `${neighborhood} ${location} ${url} ${description} ${title}`;

    // 1. Check URL for zone hints (ZAP/VivaReal URLs have zona-oeste, zona-norte etc.)
    if (url.includes('zona-oeste')) return 'Zona Oeste';
    if (url.includes('zona-norte')) return 'Zona Norte';
    if (url.includes('zona-sul')) return 'Zona Sul';
    if (url.includes('zona-central')) return 'Centro';

    // 2. Check URL for city slugs
    const urlCityMap: Record<string, string> = {
        'mangaratiba': 'Costa Verde', 'ibicui': 'Costa Verde', 'angra': 'Costa Verde',
        'niteroi': 'Niterói', 'sao-goncalo': 'São Gonçalo',
        'duque-de-caxias': 'Baixada', 'nova-iguacu': 'Baixada', 'belford-roxo': 'Baixada',
        'nilopolis': 'Baixada', 'mesquita': 'Baixada', 'itaborai': 'Baixada',
        'itaguai': 'Baixada', 'sao-joao-de-meriti': 'Baixada', 'queimados': 'Baixada',
        'marica': 'Maricá', 'teresopolis': 'Serrana', 'petropolis': 'Serrana',
    };
    for (const [slug, zone] of Object.entries(urlCityMap)) {
        if (url.includes(slug)) return zone;
    }

    // 3. Check city in location text
    for (const [cityKey, zone] of Object.entries(CITY_ZONES)) {
        if (location.includes(cityKey) || allText.includes(cityKey)) return zone;
    }

    // 4. Match neighborhood against comprehensive database
    for (const [zone, neighborhoods] of Object.entries(ZONES)) {
        for (const bairro of neighborhoods) {
            if (neighborhood === bairro) return zone;
            if (neighborhood.includes(bairro) || bairro.includes(neighborhood)) return zone;
        }
    }

    // 5. Search in ALL text for neighborhood clues
    for (const [zone, neighborhoods] of Object.entries(ZONES)) {
        for (const bairro of neighborhoods) {
            if (allText.includes(bairro)) return zone;
        }
    }

    // 6. Last resort: check URL slugs for neighborhood names  
    const urlSlug = url.split('/').pop()?.replace(/-\d+$/, '') || '';
    for (const [zone, neighborhoods] of Object.entries(ZONES)) {
        for (const bairro of neighborhoods) {
            const slug = bairro.replace(/\s+/g, '-').replace(/[()]/g, '');
            if (urlSlug.includes(slug)) return zone;
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
    const unfixed: { neighborhood: string; title: string; url: string }[] = [];

    for (const p of properties) {
        // Fix broken neighborhood names (timestamps, "Ontem", etc.)
        if (/^\d{1,2}:\d{2}$/.test(p.neighborhood) || p.neighborhood === 'Ontem' || p.neighborhood === 'Hoje' || p.neighborhood === 'Desconhecido') {
            // Try to extract real neighborhood from title or description
            for (const [zone, neighborhoods] of Object.entries(ZONES)) {
                for (const bairro of neighborhoods) {
                    if (p.title.toLowerCase().includes(bairro) || p.description.toLowerCase().includes(bairro) || p.url.toLowerCase().includes(bairro.replace(/\s+/g, '-'))) {
                        p.neighborhood = bairro.charAt(0).toUpperCase() + bairro.slice(1);
                        p.zone = zone;
                        fixed++;
                        console.log(`   🔧 Fixed broken neighborhood → "${p.neighborhood}" (${zone})`);
                        break;
                    }
                }
                if (p.zone !== 'Geral') break;
            }
        }

        if (p.zone === 'Geral') {
            const newZone = tryClassify(p);
            if (newZone !== 'Geral') {
                console.log(`   ✅ "${p.neighborhood}" → ${newZone}`);
                p.zone = newZone;
                fixed++;
            } else {
                // FORCE: if still Geral and it's from Rio de Janeiro, default to "Oeste" (largest zone)
                if (p.location.toLowerCase().includes('rio de janeiro') && p.neighborhood !== 'Desconhecido') {
                    p.zone = 'Oeste';
                    fixed++;
                    console.log(`   ⚡ FORCED "${p.neighborhood}" → Oeste (default for RJ)`);
                } else {
                    stillGeral++;
                    unfixed.push({ neighborhood: p.neighborhood, title: p.title.substring(0, 60), url: p.url.substring(0, 80) });
                }
            }
        }
    }

    fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2));
    
    console.log(`\n🏁 Enrichment complete!`);
    console.log(`   ✅ Fixed: ${fixed} properties`);
    console.log(`   ⚠️  Still "Geral": ${stillGeral} properties`);
    if (unfixed.length > 0) {
        console.log(`\n   Unclassified:`);
        unfixed.forEach(n => console.log(`      - "${n.neighborhood}" | ${n.title} | ${n.url}`));
    }
}

run();

