import React from 'react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SOURCE_LABELS } from '../types/property';

interface FilterBarProps {
    zones: string[];
    availableNeighborhoods: string[];
    
    // States
    selectedZone: string;
    selectedNeighborhoods: string[];
    selectedSources: string[];
    maxPrice: number;
    sortBy: string;
    filterRooms: string;
    filterDirectOwner: boolean;
    filterHasPhoto: boolean;
    filterFavorites: boolean;

    // Setters
    setSelectedZone: (z: string) => void;
    setSelectedNeighborhoods: (n: string[]) => void;
    setSelectedSources: (s: string[]) => void;
    setMaxPrice: (p: number) => void;
    setSortBy: (s: string) => void;
    setFilterRooms: (r: string) => void;
    setFilterDirectOwner: (v: boolean) => void;
    setFilterHasPhoto: (v: boolean) => void;
    setFilterFavorites: (v: boolean) => void;
    clearFilters: () => void;
}

export function FilterBar(props: FilterBarProps) {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            {/* Zonas (Top Row) */}
            <div className="overflow-x-auto hide-scrollbar border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 pt-2.5 pb-2 flex gap-2">
                    {props.zones.map(zone => (
                        <button
                            key={zone}
                            onClick={() => { props.setSelectedZone(zone); props.setSelectedNeighborhoods([]); }}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                                props.selectedZone === zone 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {zone === 'Todas' ? '📍 Toda a Cidade' : zone}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filtros Principais */}
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2.5 items-center">
                
                {/* Fontes */}
                <details className="relative group">
                    <summary className="list-none bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 px-3 outline-none cursor-pointer flex items-center gap-1.5 hover:bg-gray-50 transition-colors shadow-sm">
                        🌐 Sites {props.selectedSources.length > 0 && <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-4 min-w-4 flex justify-center items-center">{props.selectedSources.length}</Badge>}
                    </summary>
                    <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 shadow-2xl rounded-xl p-2 z-50 min-w-48 max-h-60 overflow-y-auto ring-1 ring-black/5">
                        {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-50 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors">
                                <input type="checkbox" checked={props.selectedSources.includes(key)} onChange={(e) => {
                                    if (e.target.checked) props.setSelectedSources([...props.selectedSources, key]);
                                    else props.setSelectedSources(props.selectedSources.filter(s => s !== key));
                                }} className="accent-indigo-600 w-4 h-4 rounded border-gray-300" />
                                {label}
                            </label>
                        ))}
                    </div>
                </details>

                {/* Bairros */}
                <details className="relative group">
                    <summary className="list-none bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 px-3 outline-none cursor-pointer flex items-center gap-1.5 hover:bg-gray-50 transition-colors shadow-sm">
                        🏘️ Bairros {props.selectedNeighborhoods.length > 0 && <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-4 min-w-4 flex justify-center items-center">{props.selectedNeighborhoods.length}</Badge>}
                    </summary>
                    <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 shadow-2xl rounded-xl p-2 z-50 min-w-56 max-h-72 overflow-y-auto ring-1 ring-black/5 grid grid-cols-1 gap-0.5">
                        {props.availableNeighborhoods.map(b => (
                            <label key={b} className="flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-50 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors">
                                <input type="checkbox" checked={props.selectedNeighborhoods.includes(b)} onChange={(e) => {
                                    if (e.target.checked) props.setSelectedNeighborhoods([...props.selectedNeighborhoods, b]);
                                    else props.setSelectedNeighborhoods(props.selectedNeighborhoods.filter(n => n !== b));
                                }} className="accent-indigo-600 w-4 h-4 rounded border-gray-300" />
                                {b}
                            </label>
                        ))}
                    </div>
                </details>

                {/* CTM / Preço Máximo */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm hover:border-indigo-300 transition-colors focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Até R$</span>
                    <input 
                        type="number" 
                        value={props.maxPrice}
                        onChange={(e) => props.setMaxPrice(Math.min(2500, Number(e.target.value)))}
                        className="w-16 outline-none text-sm font-black text-indigo-700 bg-transparent placeholder-indigo-300"
                        step="50"
                        min="100"
                        max="2500"
                    />
                </div>

                {/* Quartos */}
                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                    {[{v: 'any', l: '🛏️ Todos'}, {v: '1', l: '1'}, {v: '2', l: '2'}, {v: '3', l: '3+'}].map(opt => (
                        <button
                            key={opt.v}
                            onClick={() => props.setFilterRooms(opt.v)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                props.filterRooms === opt.v 
                                ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50' 
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {opt.l}
                        </button>
                    ))}
                </div>

                {/* Toggles (Direto, Foto, Favorito) */}
                <Button 
                    variant={props.filterDirectOwner ? "default" : "outline"} 
                    size="sm"
                    onClick={() => props.setFilterDirectOwner(!props.filterDirectOwner)}
                >
                    ✓ Direto c/ Dono
                </Button>

                <Button 
                    variant={props.filterHasPhoto ? "default" : "outline"} 
                    size="sm"
                    onClick={() => props.setFilterHasPhoto(!props.filterHasPhoto)}
                >
                    📷 Com foto
                </Button>

                <Button 
                    variant={props.filterFavorites ? "default" : "outline"} 
                    size="sm"
                    className={props.filterFavorites ? 'bg-pink-600 hover:bg-pink-700 text-white' : ''}
                    onClick={() => props.setFilterFavorites(!props.filterFavorites)}
                >
                    ❤️ Favoritos
                </Button>

                <Button variant="ghost" size="sm" onClick={props.clearFilters} className="text-gray-500 hover:text-red-600">
                    🧹 Limpar
                </Button>

                <select 
                    className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg py-2 px-3 outline-none cursor-pointer md:ml-auto shadow-sm hover:border-indigo-300 transition-colors"
                    value={props.sortBy}
                    onChange={(e) => props.setSortBy(e.target.value)}
                >
                    <option value="newest">⏱️ Mais Recentes</option>
                    <option value="lowest">💰 Menor Preço</option>
                    <option value="highest">💰 Maior Preço</option>
                    <option value="biggest">📐 Maior Área</option>
                </select>
            </div>
        </header>
    );
}
