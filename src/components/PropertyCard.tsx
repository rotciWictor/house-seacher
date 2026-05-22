import React from 'react';
import { Property, SOURCE_COLORS, SOURCE_LABELS } from '../types/property';
import { timeAgo } from '../utils/format';
import { Badge } from './ui/Badge';

interface PropertyCardProps {
    property: Property;
    isFavorite: boolean;
    onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

export function PropertyCard({ property, isFavorite, onToggleFavorite }: PropertyCardProps) {


    return (
        <a 
            href={property.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative"
        >
            {/* Image Section */}
            <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
                {property.image ? (
                    <img 
                        src={`/api/img?url=${encodeURIComponent(property.image)}`} 
                        alt={property.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium uppercase tracking-wider">Sem foto</span>
                    </div>
                )}
                
                {/* Top Overlay Gradient - Lighter */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2 pr-12">
                    <Badge variant={property.source === 'olx' ? 'default' : 'secondary'} className="shadow-sm backdrop-blur-md bg-black/30 border-white/10 text-white hover:bg-black/50">
                        {SOURCE_LABELS[property.source || 'olx'] || 'OLX'}
                    </Badge>
                    {property.directOwner && (
                        <Badge variant="success" className="shadow-lg animate-pulse-slow">
                            ✓ Direto c/ Dono
                        </Badge>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleFavorite(e, property.id);
                    }}
                    className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isFavorite ? 'text-pink-600 fill-current' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>

                {/* Bottom Overlay Gradient - Softer */}
                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                {/* Pricing / CTM */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-white/80 text-[10px] uppercase tracking-wider font-semibold mb-0.5 shadow-sm">Aluguel Nominal</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-white font-bold text-2xl tracking-tight shadow-sm">
                                R$ {property.price.toLocaleString('pt-BR')}
                            </span>
                            {property.condominio > 0 && (
                                <span className="text-white/90 text-xs font-medium shadow-sm">
                                    + R$ {property.condominio} cnd
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow bg-white">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {property.title}
                    </h3>
                </div>
                
                <p className="text-gray-500 text-xs mb-4 flex items-center gap-1.5 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {property.neighborhood}{property.zone !== 'Geral' ? `, ${property.zone}` : ''}
                </p>



                {/* Info pills */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-y-2">
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1 text-gray-600 text-xs font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {property.rooms} {property.rooms === 1 ? 'qto' : 'qtos'}
                        </div>
                        {property.area > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 text-xs font-medium border-l border-gray-200 pl-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                {property.area}m²
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                        {timeAgo(property.found_at)}
                    </span>
                </div>
            </div>
        </a>
    );
}
