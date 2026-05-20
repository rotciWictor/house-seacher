'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
    location: string;
    neighborhood: string;
    zone: string;
    description: string;
    found_at: string;
}

export default function Home() {
    const [properties, setProperties] = useState<Property[]>([]);
    
    // Filters
    const [selectedZone, setSelectedZone] = useState<string>('Todas');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<number>(1000);

    useEffect(() => {
        // Sort initially by newest
        const sorted = [...(rawProperties as Property[])].sort((a, b) => new Date(b.found_at).getTime() - new Date(a.found_at).getTime());
        setProperties(sorted);
    }, []);

    const zones = ['Todas', 'Oeste', 'Norte', 'Sul', 'Centro', 'Geral'];
    
    // Get unique neighborhoods based on selected zone
    const availableNeighborhoods = Array.from(new Set(
        properties
            .filter(p => selectedZone === 'Todas' || p.zone === selectedZone)
            .map(p => p.neighborhood)
    )).sort();

    const filteredProperties = properties.filter(p => {
        if (selectedZone !== 'Todas' && p.zone !== selectedZone) return false;
        if (selectedNeighborhood !== '' && selectedNeighborhood !== 'Todos' && p.neighborhood !== selectedNeighborhood) return false;
        if (p.price > maxPrice) return false;
        return true;
    });

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 md:pb-10 selection:bg-indigo-500 selection:text-white">
            {/* Header Mobile / Desktop */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">House<span className="text-indigo-600">Searcher</span></h1>
                    </div>
                </div>
                
                {/* Filters Section (Scrollable horizontally on mobile) */}
                <div className="bg-gray-50 border-t border-gray-200 overflow-x-auto hide-scrollbar">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex gap-3 min-w-max items-center">
                        <div className="flex bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                            {zones.map(zone => (
                                <button
                                    key={zone}
                                    onClick={() => { setSelectedZone(zone); setSelectedNeighborhood('Todos'); }}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedZone === zone ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {zone === 'Todas' ? 'Tudo' : `Zona ${zone}`}
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-8 bg-gray-300 mx-2 hidden md:block"></div>

                        <select 
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-full focus:ring-indigo-500 focus:border-indigo-500 block p-2 px-4 shadow-sm outline-none appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_auto] bg-no-repeat bg-[position:right_12px_center]"
                            value={selectedNeighborhood}
                            onChange={(e) => setSelectedNeighborhood(e.target.value)}
                        >
                            <option value="Todos">Qualquer Bairro</option>
                            {availableNeighborhoods.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                            <span className="text-sm font-medium text-gray-600">Até R$</span>
                            <input 
                                type="number" 
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                className="w-16 outline-none text-sm font-bold text-indigo-600 bg-transparent"
                                step="50"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">
                        {filteredProperties.length} imóveis encontrados
                    </h2>
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
                            Tente ajustar os filtros, aumentar o preço ou mudar a zona para ver mais opções.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProperties.map((property) => (
                            <a 
                                href={property.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                key={property.id} 
                                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Image Container */}
                                <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
                                    {property.image ? (
                                        <img 
                                            src={property.image} 
                                            alt={property.title}
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
                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                        <div className="bg-white/90 backdrop-blur-md text-gray-900 font-bold px-3 py-1 rounded-full text-sm shadow-sm w-max">
                                            R$ {property.price.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                                        <div className="bg-[#6e0ad6]/90 backdrop-blur-md text-white font-bold px-2 py-1 rounded-md text-[10px] shadow-sm tracking-wider uppercase flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                                            </svg>
                                            OLX
                                        </div>
                                        {property.zone !== 'Geral' && (
                                            <div className="bg-black/60 backdrop-blur-md text-white font-medium px-2 py-1 rounded-md text-xs shadow-sm">
                                                Z. {property.zone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-5 flex flex-col flex-grow">
                                    <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {property.title}
                                    </h3>
                                    
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 mt-1">
                                        {property.neighborhood}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-gray-600 text-sm font-medium">
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            <span>{property.rooms} {property.rooms === 1 ? 'qto' : 'qtos'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-indigo-600">
                                            <span>Ver mais</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            
            {/* Mobile Bottom Navigation Bar / Floating Action */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 md:hidden z-50 whitespace-nowrap">
                <span className="font-medium text-sm">{filteredProperties.length} imóveis na lista</span>
            </div>
        </main>
    );
}
