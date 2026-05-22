'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isCommercial } from '../utils/normalize';
import { Property } from '../types/property';
import { timeAgo } from '../utils/format';
import { PropertyCard } from './PropertyCard';
import { FilterBar } from './FilterBar';

interface ClientPropertyBrowserProps {
    initialZone?: string;
    initialNeighborhood?: string;
}

// Convert "Zona Sul" to "zona-sul"
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
const unslugify = (slug: string, options: string[]) => {
    return options.find(opt => slugify(opt) === slug) || null;
};

export function ClientPropertyBrowser({ initialZone, initialNeighborhood }: ClientPropertyBrowserProps) {
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved) setFavorites(new Set(JSON.parse(saved)));
    }, []);

    const toggleFavorite = useCallback((e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const newFavs = new Set(favorites);
        if (newFavs.has(id)) newFavs.delete(id);
        else newFavs.add(id);
        setFavorites(newFavs);
        localStorage.setItem('hs_favorites', JSON.stringify(Array.from(newFavs)));
    }, [favorites]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
                const mappedData = data.map(p => ({
                    ...p,
                    directOwner: p.directowner
                }));
                setProperties(mappedData as Property[]);
                
                // Hydrate from URL props after fetching
                if (initialZone) {
                    const allZones = Array.from(new Set(mappedData.map((p: Property) => p.zone)));
                    const matchedZone = unslugify(initialZone, allZones as string[]);
                    if (matchedZone) {
                        setSelectedZone(matchedZone);
                        if (initialNeighborhood) {
                            const allBairros = Array.from(new Set(mappedData.map((p: Property) => p.neighborhood)));
                            const matchedBairro = unslugify(initialNeighborhood, allBairros as string[]);
                            if (matchedBairro) {
                                setSelectedNeighborhoods([matchedBairro]);
                            }
                        }
                    }
                }
            }
            if (error) {
                console.error('Error fetching properties from Supabase:', error);
            }
            setLoading(false);
        }
        
        fetchProperties();
        
        if (!localStorage.getItem('hs_cookie_accepted')) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCookieAccepted(false);
        }
    }, [initialZone, initialNeighborhood]);

    // Update URL Shallowly (Hydration)
    useEffect(() => {
        if (loading) return; // don't update URL while initial load
        
        let newPath = '/aluguel';
        if (selectedZone !== 'Todas') {
            newPath += `/${slugify(selectedZone)}`;
            if (selectedNeighborhoods.length === 1) {
                newPath += `/${slugify(selectedNeighborhoods[0])}`;
            }
        }
        
        if (window.location.pathname !== newPath) {
            window.history.pushState(null, '', newPath);
        }
    }, [selectedZone, selectedNeighborhoods, loading]);

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
            
            if (filterRooms !== 'any') {
                const r = parseInt(filterRooms);
                if (r === 3 && p.rooms < 3) return false;
                else if (r !== 3 && p.rooms !== r) return false;
            }
            
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

    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
            {/* ============= HERO SECTION ============= */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6">
                        <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 animate-bounce" style={{animationDuration: '3s'}}>
                            <img src="/mascot.png" alt="House Searcher mascot" className="w-full h-full object-contain drop-shadow-2xl" />
                        </div>

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
            <FilterBar 
                zones={zones}
                availableNeighborhoods={availableNeighborhoods}
                selectedZone={selectedZone}
                selectedNeighborhoods={selectedNeighborhoods}
                selectedSources={selectedSources}
                maxPrice={maxPrice}
                sortBy={sortBy}
                filterRooms={filterRooms}
                filterDirectOwner={filterDirectOwner}
                filterHasPhoto={filterHasPhoto}
                filterFavorites={filterFavorites}
                setSelectedZone={setSelectedZone}
                setSelectedNeighborhoods={setSelectedNeighborhoods}
                setSelectedSources={setSelectedSources}
                setMaxPrice={setMaxPrice}
                setSortBy={setSortBy}
                setFilterRooms={setFilterRooms}
                setFilterDirectOwner={setFilterDirectOwner}
                setFilterHasPhoto={setFilterHasPhoto}
                setFilterFavorites={setFilterFavorites}
                clearFilters={clearFilters}
            />

            {/* ============= RESULTS ============= */}
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
                <div className="mb-5 flex justify-between items-center">
                    <h2 className="text-base md:text-lg font-bold text-gray-800">
                        {filteredProperties.length} imóveis encontrados
                        {selectedNeighborhoods.length === 1 && ` em ${selectedNeighborhoods[0]}`}
                        {selectedNeighborhoods.length === 0 && selectedZone !== 'Todas' && ` na ${selectedZone}`}
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
                            <PropertyCard 
                                key={property.id} 
                                property={property} 
                                isFavorite={favorites.has(property.id)} 
                                onToggleFavorite={toggleFavorite} 
                            />
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
                            { zone: 'Zona Oeste', emoji: '🌴', desc: 'A maior região do Rio, inclui Campo Grande, Bangu, Santa Cruz. Aluguéis mais acessíveis e bairros em expansão. Ideal para famílias buscando espaço.' },
                            { zone: 'Zona Sudoeste', emoji: '🏄', desc: 'Barra da Tijuca, Recreio, Jacarepaguá, Anil, Camorim. Áreas modernas com muita natureza e condomínios fechados.' },
                            { zone: 'Zona Norte', emoji: '🏙️', desc: 'Tijuca, Méier, Madureira, Penha. Região com melhor infraestrutura de transporte (metrô, trem). Bairros tradicionais com comércio forte.' },
                            { zone: 'Zona Sul', emoji: '🏖️', desc: 'Copacabana, Ipanema, Botafogo, Flamengo. A região mais valorizada do Rio, porém com opções de kitnets e quartos abaixo de R$ 1.000.' },
                            { zone: 'Centro', emoji: '🏛️', desc: 'Centro histórico, Lapa, Santa Teresa, Cidade Nova e Gamboa. Muitas salas comerciais e apartamentos compactos com preços acessíveis.' },
                            { zone: 'Niterói', emoji: '⛴️', desc: 'Icaraí, Ingá, Santa Rosa, Fonseca. Cidade com vista para o Rio, barcas e ônibus integrados. Opções de aluguel mais em conta.' },
                            { zone: 'Baixada Fluminense', emoji: '🚉', desc: 'Duque de Caxias, Nova Iguaçu, Nilópolis. Região metropolitana com os aluguéis mais baratos e acesso via trem e BRT.' },
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
                            { q: 'Como funciona o House Searcher?', a: 'Somos um agregador que coleta automaticamente anúncios de aluguel de sites como OLX, ZAP Imóveis e VivaReal. A cada 6 horas, nosso robô busca imóveis até R$ 1.000 no Rio de Janeiro e região metropolitana.' },
                            { q: 'O House Searcher é gratuito?', a: 'Sim, 100% gratuito. Não cobramos nada. Não somos imobiliária e não intermediamos negócios.' },
                            { q: 'Quais sites são pesquisados?', a: 'Atualmente coletamos anúncios de OLX, ZAP Imóveis, VivaReal, Mercado Livre e Chaves na Mão.' },
                            { q: 'Com que frequência os anúncios são atualizados?', a: 'A cada 6 horas, automaticamente. Anúncios mais velhos que 7 dias são removidos pelo Supabase (pg_cron) para manter a base sempre fresca.' },
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
            </section>

            {/* ============= FOOTER ============= */}
            <footer className="bg-gray-900 text-gray-400 pb-24 md:pb-8">
                <div className="max-w-7xl mx-auto px-4 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-white font-bold text-lg mb-2">🏠 House Searcher</h3>
                            <p className="text-sm leading-relaxed">
                                O agregador de aluguel em conta do Rio de Janeiro. Reunimos anúncios de vários sites num só lugar pra você não perder tempo.
                            </p>
                        </div>

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
                                Atualizado a cada 6 horas via GitHub Actions. Anúncios antigos são expurgados do sistema após 7 dias.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold text-sm mb-3">Tem uma sugestão?</h4>
                            <p className="text-sm mb-3">
                                Quer um filtro novo, outra fonte de dados ou encontrou um bug? Manda pra gente!
                            </p>
                            <a 
                                href="https://github.com/rotciWictor/house-seacher/issues/new"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                                </svg>
                                Abrir Issue no GitHub
                            </a>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                        <p>© {new Date().getFullYear()} House Searcher. Open-source sob licença MIT.</p>
                        <p>Feito com ❤️ para ajudar o carioca a achar seu cantinho.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
