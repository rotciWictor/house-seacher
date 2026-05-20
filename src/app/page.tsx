'use client';

import { useState, useEffect, useMemo } from 'react';
import rawProperties from '../data/properties.json';

interface Property {
    id: string;
    title: string;
    price: number;
    condominio: number;
    url: string;
    image: string;
    rooms: number;
    bathrooms: number;
    area: number;
    location: string;
    neighborhood: string;
    zone: string;
    description: string;
    source: string;
    directOwner: boolean;
    found_at: string;
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
}

const SOURCE_COLORS: Record<string, string> = {
    olx: 'bg-[#6e0ad6]',
    zap: 'bg-[#8229e5]',
    vivareal: 'bg-[#ff5a00]',
};

const SOURCE_LABELS: Record<string, string> = {
    olx: 'OLX',
    zap: 'ZAP',
    vivareal: 'VivaReal',
};

export default function Home() {
    const [properties, setProperties] = useState<Property[]>([]);
    
    // Filters
    const [selectedZone, setSelectedZone] = useState<string>('Todas');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('Todos');
    const [maxPrice, setMaxPrice] = useState<number>(1000);
    const [sortBy, setSortBy] = useState<string>('newest');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterRooms, setFilterRooms] = useState<string>('any');
    const [filterDirectOwner, setFilterDirectOwner] = useState<boolean>(false);
    const [filterHasPhoto, setFilterHasPhoto] = useState<boolean>(false);
    const [showFilters, setShowFilters] = useState<boolean>(false);

    useEffect(() => {
        setProperties(rawProperties as Property[]);
    }, []);

    const zones = useMemo(() => {
        const allZones = new Set(properties.map(p => p.zone));
        return ['Todas', ...Array.from(allZones).filter(z => z !== 'Geral').sort(), 'Geral'];
    }, [properties]);
    
    const availableNeighborhoods = useMemo(() => {
        return Array.from(new Set(
            properties
                .filter(p => selectedZone === 'Todas' || p.zone === selectedZone)
                .map(p => p.neighborhood)
                .filter(n => n !== 'Desconhecido')
        )).sort();
    }, [properties, selectedZone]);

    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            if (selectedZone !== 'Todas' && p.zone !== selectedZone) return false;
            if (selectedNeighborhood !== '' && selectedNeighborhood !== 'Todos' && p.neighborhood !== selectedNeighborhood) return false;
            if (p.price > maxPrice) return false;
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterRooms !== 'any' && p.rooms !== parseInt(filterRooms)) return false;
            if (filterDirectOwner && !p.directOwner) return false;
            if (filterHasPhoto && !p.image) return false;
            return true;
        }).sort((a, b) => {
            if (sortBy === 'lowest') return a.price - b.price;
            if (sortBy === 'highest') return b.price - a.price;
            if (sortBy === 'biggest') return (b.area || 0) - (a.area || 0);
            return new Date(b.found_at).getTime() - new Date(a.found_at).getTime();
        });
    }, [properties, selectedZone, selectedNeighborhood, maxPrice, sortBy, searchQuery, filterRooms, filterDirectOwner, filterHasPhoto]);

    const stats = useMemo(() => ({
        total: properties.length,
        zones: new Set(properties.map(p => p.zone)).size,
        neighborhoods: new Set(properties.map(p => p.neighborhood)).size,
        sources: new Set(properties.map(p => p.source || 'olx')).size,
        avgPrice: properties.length > 0 ? Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length) : 0,
    }), [properties]);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
            {/* ============= HERO SECTION ============= */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900">
                {/* Animated background blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 text-center">
                    {/* Logo */}
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 text-xs font-medium mb-4 border border-white/10">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        Atualizado a cada 6 horas
                    </div>

                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-3 tracking-tight">
                        Aluguel em conta
                        <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                            {' '}no Rio de Janeiro
                        </span>
                    </h1>

                    <p className="text-sm md:text-base text-indigo-200 max-w-xl mx-auto mb-6 leading-relaxed">
                        Reunimos anúncios de vários sites num só lugar. Aluguéis até R$ 1.000 no RJ inteiro.
                    </p>

                    {/* Search bar in hero */}
                    <div className="max-w-lg mx-auto mb-6">
                        <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/20 overflow-hidden border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar por bairro, título ou palavra-chave..."
                                className="w-full px-4 py-4 text-gray-800 bg-transparent outline-none text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Stats counters */}
                    <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                        {[
                            { value: stats.total, label: 'Imóveis' },
                            { value: stats.neighborhoods, label: 'Bairros' },
                            { value: stats.zones, label: 'Regiões' },
                            { value: `R$ ${stats.avgPrice}`, label: 'Preço Médio' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                                <div className="text-xs md:text-sm text-indigo-300 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============= STICKY FILTERS BAR ============= */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                {/* Zone pills */}
                <div className="overflow-x-auto hide-scrollbar">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 min-w-max items-center">
                        <div className="flex bg-gray-100 rounded-full p-1">
                            {zones.map(zone => (
                                <button
                                    key={zone}
                                    onClick={() => { setSelectedZone(zone); setSelectedNeighborhood('Todos'); }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedZone === zone ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {zone === 'Todas' ? '🏠 Tudo' : zone}
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

                        {/* Neighborhood dropdown */}
                        <select 
                            className="bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-full p-2 px-3 shadow-sm outline-none cursor-pointer"
                            value={selectedNeighborhood}
                            onChange={(e) => setSelectedNeighborhood(e.target.value)}
                        >
                            <option value="Todos">Qualquer Bairro</option>
                            {availableNeighborhoods.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>

                        {/* Price */}
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
                            <span className="text-xs font-medium text-gray-500">Até R$</span>
                            <input 
                                type="number" 
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(Math.min(1000, Number(e.target.value)))}
                                className="w-14 outline-none text-xs font-bold text-indigo-600 bg-transparent"
                                step="50"
                                min="100"
                                max="1000"
                            />
                        </div>

                        {/* Toggle advanced filters */}
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Filtros
                        </button>
                    </div>
                </div>

                {/* Advanced filters panel */}
                {showFilters && (
                    <div className="border-t border-gray-100 bg-gray-50">
                        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center">
                            {/* Rooms */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-500">Quartos:</span>
                                <div className="flex bg-white rounded-full p-0.5 border border-gray-200">
                                    {[{v: 'any', l: 'Todos'}, {v: '1', l: '1'}, {v: '2', l: '2'}, {v: '3', l: '3+'}].map(opt => (
                                        <button
                                            key={opt.v}
                                            onClick={() => setFilterRooms(opt.v)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filterRooms === opt.v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Direct owner */}
                            <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-gray-200 rounded-full px-3 py-1.5">
                                <input 
                                    type="checkbox" 
                                    checked={filterDirectOwner} 
                                    onChange={(e) => setFilterDirectOwner(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded accent-indigo-600"
                                />
                                <span className="text-xs font-medium text-gray-600">Direto c/ dono</span>
                            </label>

                            {/* Has photo */}
                            <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-gray-200 rounded-full px-3 py-1.5">
                                <input 
                                    type="checkbox" 
                                    checked={filterHasPhoto} 
                                    onChange={(e) => setFilterHasPhoto(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded accent-indigo-600"
                                />
                                <span className="text-xs font-medium text-gray-600">Com foto</span>
                            </label>

                            {/* Sort */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-500">Ordenar:</span>
                                <select 
                                    className="bg-white border border-gray-200 text-gray-700 text-xs rounded-full p-1.5 px-3 outline-none cursor-pointer"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Mais Recentes</option>
                                    <option value="lowest">Menor Preço</option>
                                    <option value="highest">Maior Preço</option>
                                    <option value="biggest">Maior Área</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ============= RESULTS ============= */}
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
                <div className="mb-5 flex justify-between items-center">
                    <h2 className="text-base md:text-lg font-bold text-gray-800">
                        {filteredProperties.length} imóveis encontrados
                    </h2>
                    <div className="text-xs text-gray-400 font-medium">
                        Última atualização: {properties.length > 0 ? timeAgo(properties[0]?.found_at) : '—'}
                    </div>
                </div>

                {filteredProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Poxa, nenhum imóvel encontrado</h2>
                        <p className="text-gray-500 max-w-sm px-4">
                            Tente ajustar os filtros, aumentar o preço ou mudar a zona.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredProperties.map((property) => (
                            <a 
                                href={property.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                key={property.id} 
                                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Image */}
                                <div className="relative h-52 w-full bg-gray-100 overflow-hidden">
                                    {property.image ? (
                                        <img 
                                            src={`/api/img?url=${encodeURIComponent(property.image)}`} 
                                            alt={property.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm font-medium">Sem foto</span>
                                        </div>
                                    )}
                                    {/* Price badge */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                        <div className="bg-white/95 backdrop-blur-md text-gray-900 font-bold px-3 py-1 rounded-full text-sm shadow-md w-max">
                                            R$ {property.price.toFixed(0)}
                                        </div>
                                        {property.condominio > 0 && (
                                            <div className="bg-black/50 backdrop-blur-md text-white/90 font-medium px-2 py-0.5 rounded-full text-[10px] shadow-sm w-max">
                                                + Cond. R$ {property.condominio}
                                            </div>
                                        )}
                                    </div>
                                    {/* Right badges */}
                                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                                        <div className={`${SOURCE_COLORS[property.source || 'olx'] || 'bg-gray-600'}/90 backdrop-blur-md text-white font-bold px-2 py-1 rounded-md text-[10px] shadow-sm tracking-wider uppercase`}>
                                            {SOURCE_LABELS[property.source || 'olx'] || 'OLX'}
                                        </div>
                                        {property.zone !== 'Geral' && (
                                            <div className="bg-black/60 backdrop-blur-md text-white font-medium px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                                                {property.zone}
                                            </div>
                                        )}
                                    </div>
                                    {/* Direct owner badge */}
                                    {property.directOwner && (
                                        <div className="absolute bottom-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white font-semibold px-2 py-0.5 rounded-full text-[10px] shadow-sm">
                                            ✓ Direto c/ Dono
                                        </div>
                                    )}
                                    {/* Time badge */}
                                    <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white/80 font-medium px-2 py-0.5 rounded-full text-[10px]">
                                        {timeAgo(property.found_at)}
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                        {property.title}
                                    </h3>
                                    
                                    <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {property.neighborhood}
                                    </p>

                                    {/* Info pills */}
                                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md text-[11px] font-medium text-gray-600">
                                            <span>🛏️</span> {property.rooms} {property.rooms === 1 ? 'qto' : 'qtos'}
                                        </div>
                                        {property.bathrooms > 0 && (
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md text-[11px] font-medium text-gray-600">
                                                <span>🚿</span> {property.bathrooms} ban
                                            </div>
                                        )}
                                        {property.area > 0 && (
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md text-[11px] font-medium text-gray-600">
                                                <span>📐</span> {property.area}m²
                                            </div>
                                        )}
                                        <div className="ml-auto flex items-center gap-1 text-indigo-600 text-xs font-medium">
                                            <span>Ver</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Mobile floating bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 md:hidden z-50 whitespace-nowrap border border-gray-700">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="font-medium text-sm">{filteredProperties.length} imóveis</span>
            </div>
        </main>
    );
}
