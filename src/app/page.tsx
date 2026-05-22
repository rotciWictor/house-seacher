'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { isCommercial } from '../utils/normalize';

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
    olx: 'bg-[#6e0ad6] text-white',
    zap: 'bg-[#8229e5] text-white',
    vivareal: 'bg-[#ff5a00] text-white',
    chavesnamao: 'bg-[#007bbf] text-white',
    mercadolivre: 'bg-[#ffe600] text-black',
};

const SOURCE_LABELS: Record<string, string> = {
    olx: 'OLX',
    zap: 'ZAP',
    vivareal: 'VivaReal',
    chavesnamao: 'Chaves na Mão',
    mercadolivre: 'Mercado Livre',
};

export default function Home() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [selectedZone, setSelectedZone] = useState<string>('Todas');
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [maxPrice, setMaxPrice] = useState<number>(1000);
    const [sortBy, setSortBy] = useState<string>('newest');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterRooms, setFilterRooms] = useState<string>('any');
    const [filterDirectOwner, setFilterDirectOwner] = useState<boolean>(false);
    const [filterHasPhoto, setFilterHasPhoto] = useState<boolean>(false);
    const [filterFavorites, setFilterFavorites] = useState<boolean>(false);

    // Pagination & Favorites
    const [cookieAccepted, setCookieAccepted] = useState(true);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 30;

    useEffect(() => {
        const saved = localStorage.getItem('hs_favorites');
        if (saved) setFavorites(new Set(JSON.parse(saved)));
    }, []);

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const newFavs = new Set(favorites);
        if (newFavs.has(id)) newFavs.delete(id);
        else newFavs.add(id);
        setFavorites(newFavs);
        localStorage.setItem('hs_favorites', JSON.stringify(Array.from(newFavs)));
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedZone, selectedNeighborhoods, selectedSources, maxPrice, sortBy, searchQuery, filterRooms, filterDirectOwner, filterHasPhoto, filterFavorites]);

    useEffect(() => {
        async function fetchProperties() {
            setLoading(true);
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('found_at', { ascending: false });
            
            if (data) {
                // Map the directowner column back to directOwner for the frontend
                const mappedData = data.map(p => ({
                    ...p,
                    directOwner: p.directowner
                }));
                setProperties(mappedData as Property[]);
            }
            if (error) {
                console.error('Error fetching properties from Supabase:', error);
            }
            setLoading(false);
        }
        
        fetchProperties();
        
        if (!localStorage.getItem('hs_cookie_accepted')) {
            setCookieAccepted(false);
        }
    }, []);

    // Fechar <details> (menus dropdown) ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const details = document.querySelectorAll('details[open]');
            details.forEach(d => {
                if (!d.contains(e.target as Node)) {
                    d.removeAttribute('open');
                }
            });
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const zones = useMemo(() => {
        const allZones = new Set(properties.map(p => p.zone));
        return ['Todas', ...Array.from(allZones).filter(z => z !== 'Geral').sort()];
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
            if (isCommercial(p.title, p.description)) return false;
            if (selectedZone !== 'Todas' && p.zone !== selectedZone) return false;
            if (selectedNeighborhoods.length > 0 && !selectedNeighborhoods.includes(p.neighborhood)) return false;
            if (selectedSources.length > 0 && !selectedSources.includes(p.source || 'olx')) return false;
            if (p.price > maxPrice) return false;
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterRooms !== 'any' && p.rooms !== parseInt(filterRooms)) return false;
            if (filterDirectOwner && !p.directOwner) return false;
            if (filterHasPhoto && !p.image) return false;
            if (filterFavorites && !favorites.has(p.id)) return false;
            return true;
        }).sort((a, b) => {
            if (sortBy === 'lowest') return a.price - b.price;
            if (sortBy === 'highest') return b.price - a.price;
            if (sortBy === 'biggest') return (b.area || 0) - (a.area || 0);
            return new Date(b.found_at).getTime() - new Date(a.found_at).getTime();
        });
    }, [properties, selectedZone, selectedNeighborhoods, selectedSources, maxPrice, sortBy, searchQuery, filterRooms, filterDirectOwner, filterHasPhoto, filterFavorites, favorites]);

    const stats = useMemo(() => ({
        total: properties.length,
        zones: new Set(properties.map(p => p.zone)).size,
        neighborhoods: Array.from(new Set(properties.map(p => p.neighborhood)))
            .filter(n => n !== 'Desconhecido')
            .length,
        sources: new Set(properties.map(p => p.source || 'olx')).size,
        avgPrice: properties.length > 0 ? Math.round(properties.reduce((s, p) => s + p.price, 0) / properties.length) : 0,
    }), [properties]);

    const clearFilters = () => {
        setSelectedZone('Todas');
        setSelectedNeighborhoods([]);
        setSelectedSources([]);
        setMaxPrice(1000);
        setSearchQuery('');
        setFilterRooms('any');
        setFilterDirectOwner(false);
        setFilterHasPhoto(false);
        setFilterFavorites(false);
        setSortBy('newest');
    };

    const paginatedProperties = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProperties, currentPage]);
    
    // Reset page to 1 when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedZone, selectedNeighborhoods, selectedSources, maxPrice, sortBy, searchQuery, filterRooms, filterDirectOwner, filterHasPhoto, filterFavorites]);

    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);

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

                <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6">
                        {/* Mascot */}
                        <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 animate-bounce" style={{animationDuration: '3s'}}>
                            <img src="/mascot.png" alt="House Searcher mascot" className="w-full h-full object-contain drop-shadow-2xl" />
                        </div>

                        {/* Text */}
                        <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 text-xs font-medium mb-3 border border-white/10">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                Atualizado a cada 6 horas
                            </div>

                            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-2 tracking-tight">
                                Aluguel em conta
                                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                                    {' '}no Rio de Janeiro
                                </span>
                            </h1>

                            <p className="text-sm md:text-base text-indigo-200 max-w-xl leading-relaxed">
                                Reunimos anúncios de vários sites num só lugar. Aluguéis até R$ 1.000 no RJ inteiro.
                            </p>
                        </div>
                    </div>

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
                {/* Row 1: Zone pills — horizontal scroll */}
                <div className="overflow-x-auto hide-scrollbar border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 pt-2.5 pb-2 flex gap-1.5">
                        {zones.map(zone => (
                            <button
                                key={zone}
                                onClick={() => { setSelectedZone(zone); setSelectedNeighborhoods([]); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${selectedZone === zone ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {zone === 'Todas' ? '🏠 Todas' : zone}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 2: All filters — wraps on mobile */}
                <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap gap-2 items-center">
                    {/* Neighborhood */}
                    {/* Sites/Sources */}
                    <details className="relative group">
                        <summary className="list-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 px-3 outline-none cursor-pointer flex items-center gap-1">
                            🌐 Sites {selectedSources.length > 0 && `(${selectedSources.length})`}
                        </summary>
                        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-50 min-w-40 max-h-60 overflow-y-auto">
                            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs">
                                    <input type="checkbox" checked={selectedSources.includes(key)} onChange={(e) => {
                                        if (e.target.checked) setSelectedSources([...selectedSources, key]);
                                        else setSelectedSources(selectedSources.filter(s => s !== key));
                                    }} className="accent-indigo-600" />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </details>

                    {/* Neighborhood Filter */}
                    <details className="relative group">
                        <summary className="list-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 px-3 outline-none cursor-pointer flex items-center gap-1">
                            📍 Bairros {selectedNeighborhoods.length > 0 && `(${selectedNeighborhoods.length})`}
                        </summary>
                        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-50 min-w-48 max-h-64 overflow-y-auto">
                            {availableNeighborhoods.map(b => (
                                <label key={b} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs">
                                    <input type="checkbox" checked={selectedNeighborhoods.includes(b)} onChange={(e) => {
                                        if (e.target.checked) setSelectedNeighborhoods([...selectedNeighborhoods, b]);
                                        else setSelectedNeighborhoods(selectedNeighborhoods.filter(n => n !== b));
                                    }} className="accent-indigo-600" />
                                    {b}
                                </label>
                            ))}
                        </div>
                    </details>

                    {/* Price */}
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
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

                    {/* Rooms */}
                    <div className="flex bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                        {[{v: 'any', l: '🛏️ Todos'}, {v: '1', l: '1'}, {v: '2', l: '2'}, {v: '3', l: '3+'}].map(opt => (
                            <button
                                key={opt.v}
                                onClick={() => setFilterRooms(opt.v)}
                                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${filterRooms === opt.v ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                {opt.l}
                            </button>
                        ))}
                    </div>

                    {/* Toggles */}
                    <button 
                        onClick={() => setFilterDirectOwner(!filterDirectOwner)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterDirectOwner ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                        ✓ Dono direto
                    </button>

                    <button 
                        onClick={() => setFilterHasPhoto(!filterHasPhoto)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterHasPhoto ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                        📷 Com foto
                    </button>

                    {/* Favorites Filter */}
                    <button 
                        onClick={() => setFilterFavorites(!filterFavorites)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterFavorites ? 'bg-pink-600 text-white border-pink-600' : 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100'}`}
                    >
                        ❤️ Só Favoritos
                    </button>

                    {/* Clear Filters Button */}
                    <button 
                        onClick={clearFilters}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    >
                        🧹 Limpar
                    </button>

                    {/* Sort — pushed right on desktop */}
                    <select 
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 px-3 outline-none cursor-pointer md:ml-auto"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">⏱️ Recentes</option>
                        <option value="lowest">💰 Menor Preço</option>
                        <option value="highest">💰 Maior Preço</option>
                        <option value="biggest">📐 Maior Área</option>
                    </select>
                </div>
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
                    <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {paginatedProperties.map((property) => (
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
                                        <div className="bg-white text-gray-900 font-bold px-3 py-1 rounded-full text-sm shadow-lg w-max">
                                            R$ {property.price.toFixed(0)}
                                        </div>
                                        {property.condominio > 0 && (
                                            <div className="bg-gray-800 text-white font-medium px-2 py-0.5 rounded-full text-[10px] shadow-md w-max">
                                                + Cond. R$ {property.condominio}
                                            </div>
                                        )}
                                    </div>
                                    {/* Right badges */}
                                    <div className="absolute top-12 right-3 flex flex-col items-end gap-1.5">
                                        <div className={`${SOURCE_COLORS[property.source || 'olx'] || 'bg-gray-600 text-white'} font-bold px-2 py-1 rounded-md text-[10px] shadow-lg tracking-wider uppercase`}>
                                            {SOURCE_LABELS[property.source || 'olx'] || 'OLX'}
                                        </div>
                                        {property.zone !== 'Geral' && (
                                            <div className="bg-gray-900 text-white font-medium px-2 py-0.5 rounded-md text-[10px] shadow-md">
                                                {property.zone}
                                            </div>
                                        )}
                                    </div>
                                    {/* Direct owner badge */}
                                    {property.directOwner && (
                                        <div className="absolute bottom-3 left-3 bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full text-[10px] shadow-md">
                                            ✓ Direto c/ Dono
                                        </div>
                                    )}
                                    {/* Time badge */}
                                    <div className="absolute bottom-3 right-3 bg-gray-900 text-white font-medium px-2 py-0.5 rounded-full text-[10px] shadow-md">
                                        {timeAgo(property.found_at)}
                                    </div>
                                    
                                    {/* Favorite Button */}
                                    <button
                                        onClick={(e) => toggleFavorite(e, property.id)}
                                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${favorites.has(property.id) ? 'text-pink-600 fill-current' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
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

                    {/* ============= PAGINATION CONTROLS ============= */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg font-medium text-sm border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                Anterior
                            </button>
                            
                            <div className="flex items-center gap-1 mx-2">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    let pageNum = currentPage;
                                    if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;
                                    
                                    if (pageNum > 0 && pageNum <= totalPages) {
                                        return (
                                            <button 
                                                key={pageNum}
                                                onClick={() => {
                                                    setCurrentPage(pageNum);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className={`w-10 h-10 rounded-lg font-semibold text-sm flex items-center justify-center transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-md scale-110' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg font-medium text-sm border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                    </>
                )}
            </div>
            
            {/* ============= ZONE GUIDE (SEO CONTENT) ============= */}
            <section className="bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Guia de Aluguéis por Região do Rio de Janeiro</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { zone: 'Zona Oeste', emoji: '🌴', desc: 'A maior região do Rio, inclui Campo Grande, Bangu, Santa Cruz, Barra da Tijuca, Recreio e Jacarepaguá. Aluguéis mais acessíveis e bairros em expansão. Ideal para famílias buscando espaço.' },
                            { zone: 'Zona Norte', emoji: '🏙️', desc: 'Tijuca, Méier, Madureira, Penha, Vila Isabel e Ilha do Governador. Região com melhor infraestrutura de transporte (metrô, trem). Bairros tradicionais com comércio forte.' },
                            { zone: 'Zona Sul', emoji: '🏖️', desc: 'Copacabana, Ipanema, Leblon, Botafogo, Flamengo e Laranjeiras. A região mais valorizada do Rio, porém com opções de kitnets e quartos abaixo de R$ 1.000.' },
                            { zone: 'Centro', emoji: '🏛️', desc: 'Centro histórico, Lapa, Santa Teresa, Cidade Nova e Gamboa. Muitas salas comerciais e apartamentos compactos com preços acessíveis e fácil acesso a transporte.' },
                            { zone: 'Niterói', emoji: '⛴️', desc: 'Icaraí, Ingá, Santa Rosa, Fonseca e Itaipu. Cidade com vista para o Rio, barcas e ônibus integrados. Opções de aluguel mais em conta que a Zona Sul.' },
                            { zone: 'Baixada Fluminense', emoji: '🚉', desc: 'Duque de Caxias, Nova Iguaçu, São João de Meriti, Belford Roxo e Nilópolis. Região metropolitana com os aluguéis mais baratos e acesso via trem e BRT.' },
                        ].map(item => (
                            <article key={item.zone} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">{item.emoji} Aluguel na {item.zone}</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============= FAQ (SEO RICH SNIPPET) ============= */}
            <section className="bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        {[
                            { q: 'Como funciona o House Searcher?', a: 'Somos um agregador que coleta automaticamente anúncios de aluguel de sites como OLX, ZAP Imóveis e VivaReal. A cada 6 horas, nosso robô busca imóveis até R$ 1.000 no Rio de Janeiro e região metropolitana. Você encontra tudo num só lugar, sem precisar abrir 10 abas.' },
                            { q: 'O House Searcher é gratuito?', a: 'Sim, 100% gratuito. Não cobramos nada. Não somos imobiliária e não intermediamos negócios. Apenas agregamos anúncios públicos de outros sites para facilitar sua busca.' },
                            { q: 'Quais sites são pesquisados?', a: 'Atualmente coletamos anúncios de OLX, ZAP Imóveis e VivaReal. Estamos trabalhando para incluir mais fontes como QuintoAndar e ImovelWeb.' },
                            { q: 'Com que frequência os anúncios são atualizados?', a: 'A cada 6 horas, automaticamente. Anúncios com mais de 3 dias são removidos para manter a base sempre fresca.' },
                            { q: 'Posso encontrar imóveis acima de R$ 1.000?', a: 'Nosso foco é em aluguéis acessíveis até R$ 1.000. Filtramos apenas imóveis nessa faixa de preço para ajudar quem busca moradia em conta no Rio de Janeiro.' },
                            { q: 'Quais regiões do Rio são cobertas?', a: 'Cobrimos todo o município do Rio de Janeiro (Zona Sul, Norte, Oeste e Centro) além de Niterói, São Gonçalo, Baixada Fluminense (Duque de Caxias, Nova Iguaçu, etc.), Maricá e região serrana.' },
                        ].map((faq, i) => (
                            <details key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
                                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    {faq.q}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <p className="px-5 pb-4 text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
                {/* FAQ Schema JSON-LD */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        { "@type": "Question", "name": "Como funciona o House Searcher?", "acceptedAnswer": { "@type": "Answer", "text": "Somos um agregador que coleta automaticamente anúncios de aluguel de sites como OLX, ZAP Imóveis e VivaReal. A cada 6 horas, nosso robô busca imóveis até R$ 1.000 no Rio de Janeiro e região metropolitana." }},
                        { "@type": "Question", "name": "O House Searcher é gratuito?", "acceptedAnswer": { "@type": "Answer", "text": "Sim, 100% gratuito. Não cobramos nada. Não somos imobiliária e não intermediamos negócios." }},
                        { "@type": "Question", "name": "Quais sites são pesquisados?", "acceptedAnswer": { "@type": "Answer", "text": "Atualmente coletamos anúncios de OLX, ZAP Imóveis e VivaReal. Estamos trabalhando para incluir mais fontes." }},
                        { "@type": "Question", "name": "Com que frequência os anúncios são atualizados?", "acceptedAnswer": { "@type": "Answer", "text": "A cada 6 horas, automaticamente. Anúncios com mais de 3 dias são removidos." }},
                        { "@type": "Question", "name": "Posso encontrar imóveis acima de R$ 1.000?", "acceptedAnswer": { "@type": "Answer", "text": "Nosso foco é em aluguéis acessíveis até R$ 1.000 no Rio de Janeiro." }},
                        { "@type": "Question", "name": "Quais regiões do Rio são cobertas?", "acceptedAnswer": { "@type": "Answer", "text": "Cobrimos todo o município do Rio de Janeiro (Zona Sul, Norte, Oeste e Centro) além de Niterói, São Gonçalo, Baixada Fluminense, Maricá e região serrana." }},
                    ]
                }) }} />
            </section>

            {/* ============= FOOTER ============= */}
            <footer className="bg-gray-900 text-gray-400 pb-24 md:pb-8">
                <div className="max-w-7xl mx-auto px-4 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Brand */}
                        <div>
                            <h3 className="text-white font-bold text-lg mb-2">🏠 House Searcher</h3>
                            <p className="text-sm leading-relaxed">
                                O agregador de aluguel em conta do Rio de Janeiro. Reunimos anúncios de vários sites num só lugar pra você não perder tempo.
                            </p>
                        </div>

                        {/* Sources */}
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-3">Fontes de dados</h4>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-[#6e0ad6] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">OLX</span>
                                <span className="bg-[#8229e5] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">ZAP</span>
                                <span className="bg-[#ff5a00] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">VivaReal</span>
                                <span className="bg-[#fff159] text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">Mercado Livre</span>
                                <span className="bg-[#0052cc] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">Chaves na Mão</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Atualizado a cada 6 horas via GitHub Actions. Anúncios antigos são expurgados do sistema após 7 dias para evitar "anúncios zumbis".
                            </p>
                        </div>

                        {/* Suggestions */}
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-3">Tem uma sugestão?</h4>
                            <p className="text-sm mb-3">
                                Quer um filtro novo, outra fonte de dados ou encontrou um bug? Manda pra gente!
                            </p>
                            <a 
                                href="https://github.com/rotciWictor/house-seacher/issues/new?title=Sugest%C3%A3o%3A%20&body=Descreva%20sua%20sugest%C3%A3o%20aqui...&labels=sugestão"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                Enviar sugestão
                            </a>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
                        <p className="text-xs text-gray-500">
                            © 2026 House Searcher — Projeto open source. Não somos imobiliária.
                        </p>
                        <div className="flex items-center gap-4">
                            <a 
                                href="https://github.com/rotciWictor/house-seacher" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Mobile floating bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 md:hidden z-50 whitespace-nowrap border border-gray-700">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="font-medium text-sm">{filteredProperties.length} imóveis</span>
            </div>
            {/* Cookie Banner */}
            {!cookieAccepted && (
                <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-[100] flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-gray-700 animate-in slide-in-from-bottom-10">
                    <div className="text-sm text-center md:text-left">
                        🍪 Utilizamos cookies e armazenamento local para salvar seus <b>Favoritos</b>. Não rastreamos nem vendemos seus dados.
                    </div>
                    <button 
                        onClick={() => {
                            localStorage.setItem('hs_cookie_accepted', 'true');
                            setCookieAccepted(true);
                        }}
                        className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors w-full md:w-auto"
                    >
                        Entendi e Aceito
                    </button>
                </div>
            )}
        </main>
    );
}
