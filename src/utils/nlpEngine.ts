import { containerBootstrap } from '@nlpjs/core';
import { Ner } from '@nlpjs/ner';
import { LangPt } from '@nlpjs/lang-pt';
import { supabase } from '../lib/supabase';

let nerInstance: any = null;
let isTrained = false;

// Dicionário base inicial (ficará cada vez maior com o auto-aprendizado)
const seedLandmarks = [
    'Park Shopping', 'Norte Shopping', 'Barra Shopping', 'Rio Sul', 'Shopping Tijuca', 
    'Nova América', 'Shopping Leblon', 'Botafogo Praia Shopping', 'Carioca Shopping',
    'Bangu Shopping', 'West Shopping', 'Via Parque', 'Village Mall', 'Boulevard Shopping',
    'Américas Shopping', 'Recreio Shopping', 'Plaza Shopping', 'São Gonçalo Shopping',
    'Madureira Shopping', 'Center Shopping', 'Passeio Shopping',
    'Estação Central do Brasil', 'Metrô Botafogo', 'Metrô Flamengo', 'Metrô Largo do Machado',
    'Metrô Catete', 'Metrô Glória', 'Metrô Cinelândia', 'Metrô Carioca', 'Metrô Uruguaiana',
    'Metrô Presidente Vargas', 'Metrô Praça Onze', 'Metrô Estácio', 'Metrô Afonso Pena',
    'Metrô São Francisco Xavier', 'Metrô Saens Peña', 'Metrô Uruguai', 'Metrô Maracanã',
    'Metrô Triagem', 'Metrô Maria da Graça', 'Metrô Nova América', 'Metrô Inhaúma',
    'Metrô Engenho da Rainha', 'Metrô Thomaz Coelho', 'Metrô Vicente de Carvalho',
    'Metrô Irajá', 'Metrô Colégio', 'Metrô Coelho Neto', 'Metrô Acari', 'Metrô Fazenda Botafogo',
    'Metrô Pavuna', 'Metrô São Cristóvão', 'Metrô Cidade Nova', 'Metrô Cardeal Arcoverde',
    'Metrô Siqueira Campos', 'Metrô Cantagalo', 'Metrô General Osório', 'Metrô Nossa Senhora da Paz',
    'Metrô Jardim de Alah', 'Metrô Antero de Quental', 'Metrô São Conrado', 'Metrô Jardim Oceânico',
    'BRT Alvorada', 'BRT Mato Alto', 'BRT Recreio', 'BRT Madureira', 'BRT Vicente de Carvalho',
    'Supermercado Guanabara', 'Mundial', 'Prezunic', 'Assaí', 'Atacadão', 'Carrefour', 'Extra', 'Pão de Açúcar'
];

export async function initNlpEngine() {
    if (isTrained && nerInstance) return nerInstance;

    console.log('\n🧠 Inicializando Motor NLP (Inteligência Artificial Local)...');
    
    const container = await containerBootstrap();
    container.use(LangPt);
    const ner = new Ner({ container });

    // 1. Carrega as sementes (Dicionário inicial)
    for (const seed of seedLandmarks) {
        ner.addRuleOptionTexts('pt', 'landmark', seed, [seed]);
    }

    // 2. Tenta baixar os aprendizados do Supabase (Auto-aprendizado)
    try {
        const { data, error } = await supabase.from('learned_landmarks').select('name');
        if (data && data.length > 0) {
            console.log(`   📚 Carregando ${data.length} lugares aprendidos do Supabase...`);
            for (const item of data) {
                // Adiciona a palavra aprendida à entidade 'landmark'
                ner.addRuleOptionTexts('pt', 'landmark', item.name, [item.name]);
            }
        }
    } catch (e) {
        // Tabela não existe ou erro de conexão, segue a vida só com as sementes
    }

    nerInstance = ner;
    isTrained = true;
    console.log('   ✅ Motor NLP treinado e pronto!');
    
    return nerInstance;
}

export async function extractEntityNLP(text: string): Promise<string | null> {
    if (!isTrained) await initNlpEngine();
    
    try {
        const entities = await nerInstance.process({ locale: 'pt', text });
        // console.log('ENTITIES:', entities.entities);
        if (entities && entities.entities && entities.entities.length > 0) {
            // Pegamos a primeira entidade 'landmark' que a IA encontrou com confiança
            const landmarkEntity = entities.entities.find((e: any) => e.entity === 'landmark');
            if (landmarkEntity) {
                return landmarkEntity.option; // O nome correto normalizado
            }
        }
    } catch (e) {
        console.error('NLP processing error:', e);
    }
    return null;
}

export async function cleanAddress(address: string): Promise<string> {
    // 1. Tenta o Libpostal (GitHub Actions / Local Docker)
    try {
        const response = await fetch(`http://localhost:8080/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: address })
        });
        
        if (response.ok) {
            const parsed = await response.json();
            // parsed: [{label: "road", value: "r. das hortencias"}, {label: "house_number", value: "41"}, ...]
            let road = '', number = '', suburb = '', city = '';
            for (const item of parsed) {
                if (item.label === 'road') road = item.value;
                if (item.label === 'house_number') number = item.value;
                if (item.label === 'suburb' || item.label === 'city_district') suburb = item.value;
                if (item.label === 'city') city = item.value;
            }
            
            const parts = [];
            if (road) parts.push(number ? `${road}, ${number}` : road);
            if (suburb) parts.push(suburb);
            if (city) parts.push(city);
            
            if (parts.length > 0) {
                // Capitalize first letters just to be pretty
                return parts.join(', ').replace(/\b\w/g, l => l.toUpperCase());
            }
        }
    } catch (e) {
        // Libpostal offline (provavelmente rodando local sem Docker). Fallback silencioso.
    }

    // 2. Fallback Heurístico (Regex)
    let clean = address;
    clean = clean.replace(/\b\d{5}\s*-\s*\d{5}-\d{3}\b/g, ''); // CEP Range
    clean = clean.replace(/\b\d{5}-\d{3}\b/g, ''); // CEP normal
    clean = clean.replace(/\b\d{5}\b/g, ''); // CEP incompleto
    clean = clean.replace(/\b\d+\s*(quartos?|banheiros?|vagas?|m²|m2)\b/gi, '');
    clean = clean.replace(/para alugar com\b/gi, '');
    clean = clean.replace(/(Apartamento|Casa|Terreno|Im[óo]vel|Me|preendimentos?|Empreendimentos?)/gi, '');
    clean = clean.replace(/\bBrazil\b/gi, '');
    clean = clean.replace(/\bLtda\b.*?(\b|$)/gi, '');
    clean = clean.replace(/\bRio de Janeiro Zona Oeste\b/gi, 'Rio de Janeiro'); 
    clean = clean.replace(/\bRJ\b/gi, '');
    
    clean = clean.replace(/emIrajá/gi, 'Irajá');
    clean = clean.replace(/emCentro/gi, 'Centro');
    clean = clean.replace(/[-]/g, ','); 
    clean = clean.replace(/,\s*,/g, ','); 
    clean = clean.replace(/\s+/g, ' ');
    clean = clean.replace(/^[\s,]+|[\s,]+$/g, ''); 
    
    // Dedup
    const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
    return Array.from(new Set(parts)).join(', ');
}
