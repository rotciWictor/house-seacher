'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, BedDouble, Bath, Maximize, ExternalLink, ShieldCheck, Clock, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Property } from '../types/property';
import { timeAgo } from '../utils/format';

interface PropertyModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyModal({ property, isOpen, onClose }: PropertyModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  // Reset index when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [property]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!property) return null;

  const totalCost = property.price + (property.condominio || 0);

  const imagesList = property.images && property.images.length > 0 
    ? property.images 
    : (property.image ? [property.image] : []);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex < imagesList.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-card text-card-foreground w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden pointer-events-auto border border-border"
            >
              
              {/* Close Button Mobile */}
              <button 
                onClick={onClose}
                className="md:hidden absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full backdrop-blur-md"
              >
                <X size={20} />
              </button>

              {/* Left Side: Image Carousel */}
              <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-100 dark:bg-neutral-900 group">
                {imagesList.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        src={imagesList[currentImageIndex]} 
                        alt={`${property.title} - Foto ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    </AnimatePresence>
                    
                    {/* Carousel Controls */}
                    {imagesList.length > 1 && (
                      <>
                        <button 
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                          disabled={currentImageIndex === 0}
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                          disabled={currentImageIndex === imagesList.length - 1}
                        >
                          <ChevronRight size={24} />
                        </button>
                        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                          <Camera size={14} /> {currentImageIndex + 1} / {imagesList.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Camera size={32} />
                    <span>Sem Imagem</span>
                  </div>
                )}
                
                {/* Floating Badges on Image */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="bg-primary/90 backdrop-blur-md text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                    {property.source.toUpperCase()}
                  </span>
                  {property.directOwner && (
                    <span className="bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                      <ShieldCheck size={14} /> Direto c/ Dono
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="w-full md:w-1/2 flex flex-col max-h-full overflow-y-auto custom-scrollbar">
                
                {/* Header Actions */}
                <div className="hidden md:flex justify-end p-4 pb-0">
                  <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 hover:text-foreground"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 pt-4 md:pt-0 flex-1 flex flex-col">
                  {/* Location & Time */}
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md text-xs font-medium text-foreground">
                      <MapPin size={14} /> {property.zone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {timeAgo(property.found_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl md:text-2xl font-bold leading-tight mb-2 text-foreground">
                    {property.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-6">
                    {property.neighborhood}, {property.location}
                  </p>

                  {/* Pricing Box */}
                  <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 mb-6 border border-border">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Custo Total Mensal</span>
                      <span className="text-3xl font-black text-primary">R$ {totalCost}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-border mt-3">
                      <span className="text-gray-500">Aluguel: R$ {property.price}</span>
                      <span className="text-gray-500">Condomínio: {property.condominio ? `R$ ${property.condominio}` : 'Isento / Não inf.'}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl">
                      <BedDouble size={20} className="text-gray-400 mb-1" />
                      <span className="font-bold text-foreground">{property.rooms === 0 ? 'Kitnet' : property.rooms}</span>
                      <span className="text-xs text-gray-500">{property.rooms === 1 ? 'Quarto' : 'Quartos'}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl">
                      <Bath size={20} className="text-gray-400 mb-1" />
                      <span className="font-bold text-foreground">{property.bathrooms || 1}</span>
                      <span className="text-xs text-gray-500">Banheiro{property.bathrooms > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl">
                      <Maximize size={20} className="text-gray-400 mb-1" />
                      <span className="font-bold text-foreground">{property.area || '--'}</span>
                      <span className="text-xs text-gray-500">m²</span>
                    </div>
                  </div>

                  {/* Description (from Deep Scrape) */}
                  <div className="mb-8 flex-1">
                    <h3 className="font-bold text-lg mb-3 text-foreground">Descrição Original</h3>
                    <div 
                        className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border/50 max-h-48 overflow-y-auto custom-scrollbar"
                        dangerouslySetInnerHTML={{ __html: property.description || "Descrição não disponível para este imóvel." }}
                    />
                  </div>

                  {/* Action Button */}
                  <a 
                    href={property.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Abrir Anúncio Original <ExternalLink size={20} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
