export function calculateRiskScore(text: string, rules: Array<{ pattern: RegExp | string, weight: number }>): number {
    let score = 0;
    const lowerText = text.toLowerCase();

    for (const rule of rules) {
        if (typeof rule.pattern === 'string') {
            if (lowerText.includes(rule.pattern.toLowerCase())) {
                score += rule.weight;
            }
        } else if (rule.pattern instanceof RegExp) {
            if (rule.pattern.test(lowerText)) {
                score += rule.weight;
            }
        }
    }
    return score;
}

export function isCommercial(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    const lowerTitle = title.toLowerCase().trim();
    
    // 1. Palavras que MATAM o anúncio se aparecerem no TÍTULO (tolerância zero)
    if (/\b(comercial|comerciais|loja|galpão|galpao|consultório|consultorio|clínica|clinica|coworking|sobreloja|depósito|armazém|garagem|vaga|estacionamento|box|laje corporativa|ponto comercial|escritório|escritorio|terreno|lote|container)\b/.test(lowerTitle)) {
        return true;
    }
    
    // 2. Regras para "Sala" no título
    if (/\bsala(s)?\b/.test(lowerTitle)) {
        if (!/\b(quarto|kitnet|quitinete|casa|apto|apartamento|studio)\b/.test(lowerTitle)) {
            return true;
        }
        if (lowerTitle.includes('sala comercial') || lowerTitle.includes('conjunto') || lowerTitle.startsWith('sala ')) {
            return true;
        }
    }

    // 3. Regras de pontuação para a descrição (Score)
    const commercialRules = [
        { pattern: 'sala comercial', weight: 100 },
        { pattern: 'galpão', weight: 100 },
        { pattern: 'consultório', weight: 100 },
        { pattern: 'laje corporativa', weight: 100 },
        { pattern: 'ponto comercial', weight: 100 },
        { pattern: 'box comercial', weight: 100 },
        { pattern: 'terreno comercial', weight: 100 },
        { pattern: 'escritório', weight: 80 },
        { pattern: 'prédio comercial', weight: 100 },
        { pattern: 'predio comercial', weight: 100 },
        { pattern: 'vaga de garagem', weight: 40 },
        { pattern: 'alugo vaga', weight: 80 },
        { pattern: 'aluga-se vaga', weight: 80 },
        { pattern: 'passo o ponto', weight: 100 },
        { pattern: 'sobreloja', weight: 100 },
        { pattern: 'franquia', weight: 100 },
        { pattern: 'polo gastronômico', weight: 60 },
        { pattern: 'polo gastronomico', weight: 60 },
        { pattern: 'ponto logístico', weight: 100 },
        { pattern: 'ponto logistico', weight: 100 },
        { pattern: 'próprio para restaurante', weight: 100 },
        { pattern: 'imóvel comercial', weight: 100 },
        { pattern: 'imovel comercial', weight: 100 },
        { pattern: 'loja comercial', weight: 100 },
        { pattern: 'espaço comercial', weight: 80 },
        { pattern: 'galpão logístico', weight: 100 },
        { pattern: 'galpao logistico', weight: 100 },
        { pattern: /ideal para\s+(?:qualquer\s+)?(?:tipo de\s+)?(?:com[eé]rcio|neg[oó]cio|empresa|cl[ií]nica|loja|escrit[oó]rio)/i, weight: 100 },
        { pattern: /excelente para\s+(?:com[eé]rcio|neg[oó]cio|empresa|cl[ií]nica|loja|escrit[oó]rio)/i, weight: 100 },
        { pattern: /pr[oó]prio para\s+(?:com[eé]rcio|neg[oó]cio|empresa|cl[ií]nica|loja|escrit[oó]rio|restaurante|bar|lanchonete)/i, weight: 100 },
        { pattern: 'ideal para seu negócio', weight: 100 },
        { pattern: 'ideal para o seu negócio', weight: 100 },
        { pattern: 'ideal para clínicas', weight: 100 },
        { pattern: 'ideal para clinicas', weight: 100 },
        { pattern: 'ideal para empresa', weight: 80 },
        { pattern: 'ótimo para empresa', weight: 80 }
    ];

    const score = calculateRiskScore(text, commercialRules);
    
    // Se a pontuação passar de 60, consideramos comercial.
    if (score >= 60) return true;
    
    return false;
}

export function isForSale(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    
    if (/\b(passo ponto|vendo|vende-se|venda)\b/.test(title.toLowerCase())) return true;
    
    if (text.includes('passo ponto') || text.includes('vendo apartamento') || text.includes('vendo casa') || text.includes('vendo urgência')) {
        return true;
    }
    
    return false;
}

export function isSeasonal(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    
    if (/\b(?:dia|diária|diaria|temporada)\b/i.test(title)) return true;

    const seasonalRules = [
        { pattern: 'temporada', weight: 100 },
        { pattern: 'diária', weight: 100 },
        { pattern: 'diaria', weight: 100 },
        { pattern: 'réveillon', weight: 80 },
        { pattern: 'reveillon', weight: 80 },
        { pattern: 'carnaval', weight: 80 },
        { pattern: 'airbnb', weight: 100 },
        { pattern: 'hospedagem', weight: 60 },
        { pattern: 'hostel', weight: 100 },
        { pattern: 'pousada', weight: 100 },
        { pattern: 'hotel', weight: 100 },
        { pattern: /pacote de \d+ dias/i, weight: 100 },
        { pattern: /por dia/i, weight: 80 },
        { pattern: 'fim de ano', weight: 50 },
        { pattern: /aluguel por tempo determinado/i, weight: 60 },
        { pattern: /curta duração/i, weight: 80 },
    ];

    const score = calculateRiskScore(text, seasonalRules);
    
    // Se a pontuação passar de 60, consideramos temporada.
    if (score >= 60) return true;

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
