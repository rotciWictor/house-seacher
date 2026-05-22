export function isCommercial(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    
    // Palavras fortes que indicam imóvel comercial
    const commercialKeywords = [
        'loja', 'sala comercial', 'galpão', 'galpao', 'consultório', 'consultorio',
        'prédio comercial', 'predio comercial', 'laje corporativa', 'coworking',
        'ponto comercial', 'box comercial', 'depósito', 'deposito', 'armazém',
        'armazem', 'terreno comercial', 'sobreloja', 'escritório', 'escritorio'
    ];

    // Se o título tiver explicitamente "apartamento" ou "casa", damos um peso maior residencial
    const isExplicitlyResidential = /\b(apartamento|apt|apto|casa|kitnet|conjugado)\b/.test(text);

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

export function normalizeNeighborhood(text: string): string {
    const raw = text.split(',')[0].toLowerCase().trim();
    
    // Mapeamento simples de bairros problemáticos
    if (raw.includes('copacabana')) return 'Copacabana';
    if (raw.includes('botafogo')) return 'Botafogo';
    if (raw.includes('tijuca') && !raw.includes('barra')) return 'Tijuca';
    if (raw.includes('barra da tijuca')) return 'Barra da Tijuca';
    if (raw.includes('recreio')) return 'Recreio dos Bandeirantes';
    if (raw.includes('centro') && !raw.includes('rio centro')) return 'Centro';
    if (raw.includes('campo grande')) return 'Campo Grande';
    if (raw.includes('freguesia')) return 'Freguesia';
    if (raw.includes('del castilho')) return 'Del Castilho';
    if (raw.includes('meier') || raw.includes('méier')) return 'Méier';
    if (raw.includes('taquara')) return 'Taquara';
    
    // Remove "Rio de Janeiro" se vier junto (ex: "Centro - Rio de Janeiro")
    let cleaned = raw.replace(/-?\s*rio de janeiro\s*-?/g, '').trim();
    
    // Capitalize primeira letra de cada palavra
    cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
    
    return cleaned || 'Desconhecido';
}
