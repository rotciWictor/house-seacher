export interface Property {
    id: string;
    title: string;
    price: number;
    condominio: number;
    url: string;
    image?: string;
    images?: string[];
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
    lat?: number;
    lng?: number;
    precision?: 'street' | 'neighborhood';
}

export const SOURCE_COLORS: Record<string, string> = {
    olx: 'bg-[#6e0ad6] text-white',
    zap: 'bg-[#8229e5] text-white',
    vivareal: 'bg-[#ff5a00] text-white',
    chavesnamao: 'bg-[#007bbf] text-white',
    mercadolivre: 'bg-[#ffe600] text-black',
};

export const SOURCE_LABELS: Record<string, string> = {
    olx: 'OLX',
    zap: 'ZAP',
    vivareal: 'VivaReal',
    chavesnamao: 'Chaves na Mão',
    mercadolivre: 'Mercado Livre',
};
