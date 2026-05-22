export function isCommercial(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    
    // Palavras fortes que indicam imóvel comercial ou garagem/vaga
    const commercialKeywords = [
        'loja', 'sala comercial', 'galpão', 'galpao', 'consultório', 'consultorio',
        'prédio comercial', 'predio comercial', 'laje corporativa', 'coworking',
        'ponto comercial', 'box comercial', 'depósito', 'deposito', 'armazém',
        'armazem', 'terreno comercial', 'sobreloja', 'escritório', 'escritorio',
        'garagem', 'vaga', 'vaga de garagem', 'estacionamento', 'box de garagem'
    ];

    // Se o título começar com Sala ou Conjunto (padrão ZAP/VivaReal para imóveis comerciais)
    if (/^(sala\b|conjunto\b|lote\b|terreno\b|prédio\b|galpão\b|loja\b)/i.test(title.trim())) {
        return true;
    }

    // Se o título tiver explicitamente "apartamento" ou "casa", damos um peso maior residencial
    const isExplicitlyResidential = /\b(apartamento|apt|apto|casa|kitnet|quitinete|conjugado|loft|studio|flat)\b/.test(text);

    for (const kw of commercialKeywords) {
        if (text.includes(kw)) {
            // Se tem palavra comercial, mas também diz que é apartamento, pode ser "apartamento perto de loja"
            // Mas se a palavra comercial estiver no título, é quase certeza que é comercial.
            const titleHasKw = title.toLowerCase().includes(kw);
            if (titleHasKw) return true;
            
            // Se está só na descrição, checa se não é um apartamento
            if (!isExplicitlyResidential) return true;
        }
    }
    
    return false;
}

export function isSeasonal(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    
    // Palavras fortes que indicam aluguel por temporada ou curto prazo
    const seasonalKeywords = [
        'temporada', 'diária', 'diaria', 'réveillon', 'reveillon', 'carnaval',
        'airbnb', 'hospedagem', 'pacote de', 'por dia', 'fim de ano',
        'hostel', 'pousada', 'hotel'
    ];

    // Se o título indicar explicitamente diária ou temporada
    if (/\b(?:dia|diária|diaria|temporada)\b/i.test(title)) return true;

    for (const kw of seasonalKeywords) {
        if (text.includes(kw)) {
            return true;
        }
    }

    return false;
}

import bairrosData from '../data/bairros_rj.json';
import { distance } from 'fastest-levenshtein';

export function limpar_e_padronizar_texto(texto: string): string {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// Ordena os bairros do maior pro menor pra evitar que "Botafogo" dê match antes de "Botafogo" (não tem sobreposição aqui, mas ex: "Vargem Pequena" antes de "Vargem")
const OFFICIAL_BAIRROS = bairrosData
    .map(b => b.nome.trim())
    .sort((a, b) => b.length - a.length);

export function normalizeNeighborhood(text: string): string {
    const raw = text.toLowerCase().trim();
    
    // Mapeamento manual de apelidos comuns ou erros de digitação conhecidos
    if (raw.includes('recreio')) return 'Recreio dos Bandeirantes';
    if (raw.includes('freguesia (jacarepaguá)') || raw.includes('freguesia - jacarepaguá')) return 'Freguesia (Jacarepaguá)';
    if (raw.includes('meier') || raw.includes('méier')) return 'Méier';
    if (raw.includes('taquara')) return 'Taquara';
    
    // Fallback: Remove "Rio de Janeiro" e estados do final para isolar o bairro real
    let cleaned = raw.split(',')[0]
        .replace(/-?\s*rio de janeiro\s*-?/ig, '')
        .replace(/-?\s*rj\s*$/ig, '')
        .replace(/-?\s*niter[óo]i\s*-?/ig, '')
        .replace(/-?\s*s[ãa]o gon[çc]alo\s*-?/ig, '')
        .replace(/-?\s*nova igua[çc]u\s*-?/ig, '')
        .replace(/-?\s*duque de caxias\s*-?/ig, '')
        .trim();

    const cleanRawForIncludes = limpar_e_padronizar_texto(raw);
    const cleanCleanedForFuzzy = limpar_e_padronizar_texto(cleaned);

    let bestMatch: string | null = null;
    let minDistance = Infinity;

    // Tenta encontrar o bairro oficial no texto
    for (const bairro of OFFICIAL_BAIRROS) {
        const cleanBairro = limpar_e_padronizar_texto(bairro);
        
        // 1. Busca por substring exata (ignora acentos)
        if (cleanRawForIncludes.includes(cleanBairro)) {
            // Checagem extra de falsos positivos (ex: "Centro" no meio de "Rio Centro")
            if (cleanBairro === 'centro' && cleanRawForIncludes.includes('rio centro')) return 'Riocentro';
            return bairro;
        }

        // 2. Busca por Fuzzy Matching (distância de Levenshtein) contra o bairro isolado
        const dist = distance(cleanCleanedForFuzzy, cleanBairro);
        if (dist < minDistance) {
            minDistance = dist;
            bestMatch = bairro;
        }
    }
    
    // 3. Aplica o corte (cutoff) do Fuzzy Matching
    // Permite 1 erro de digitação a cada 5 caracteres (ex: Copacabana = 10 chars = até 2 erros permitidos)
    const maxAllowedDist = Math.max(1, Math.floor(cleanCleanedForFuzzy.length / 5));
    if (bestMatch && minDistance <= maxAllowedDist && cleanCleanedForFuzzy.length >= 4) {
        return bestMatch;
    }
    
    cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
    
    // Filtro de lixo (strings muito grandes, nomes de empresas, datas de scraping)
    const lowerClean = cleaned.toLowerCase();
    if (
        cleaned.length > 25 || 
        lowerClean.includes('ltda') || 
        lowerClean.includes('imóveis') || 
        lowerClean.includes('para alugar') ||
        lowerClean.includes('hoje') ||
        /\d{1,2} de [a-z]+/i.test(cleaned)
    ) {
        return 'Desconhecido';
    }
    
    return cleaned || 'Desconhecido';
}

// Lista de bairros da AP4 (Zona Sudoeste)
const ZONA_SUDOESTE = [
    'barra da tijuca', 'barra', 'recreio', 'jacarepaguá', 'taquara', 'anil', 'curicica',
    'pechincha', 'praça seca', 'itanhangá', 'gardênia azul', 'vila valqueire', 'tanque',
    'camorim', 'grumari', 'joá', 'freguesia (jacarepaguá)', 'freguesia', 'rio das pedras',
    'cidade de deus', 'vargem grande', 'vargem pequena', 'barra olímpica'
];

export function reclassifyZone(currentZone: string, neighborhood: string): string {
    // Se já não é Zona Oeste, não precisamos checar se é Sudoeste
    if (currentZone !== 'Zona Oeste') return currentZone;
    
    const lowerBairro = neighborhood.toLowerCase();
    
    // Se o bairro pertence à AP4, reclassifica como Zona Sudoeste
    if (ZONA_SUDOESTE.some(b => lowerBairro.includes(b) || b.includes(lowerBairro))) {
        return 'Zona Sudoeste';
    }
    
    // Continua como Zona Oeste
    return currentZone;
}

// "Dar uma segunda vista no lixo": se o bairro veio destruído (ex: "Ontem", "10:30", "Desconhecido"),
// varremos o título e a descrição em busca de algum bairro oficial
export function recoverNeighborhood(neighborhood: string, title: string, description: string): string {
    const norm = normalizeNeighborhood(neighborhood);
    if (norm !== 'Desconhecido') return norm;

    const fullText = limpar_e_padronizar_texto(`${title} ${description}`);
    
    // Procura o maior bairro oficial possível dentro do título/descrição
    for (const bairro of OFFICIAL_BAIRROS) {
        const cleanBairro = limpar_e_padronizar_texto(bairro);
        if (fullText.includes(cleanBairro) && cleanBairro.length >= 4) {
            return bairro; // Resgatado do lixo!
        }
    }

    return 'Desconhecido';
}
