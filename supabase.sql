-- House Searcher v3.0 - Supabase Schema

-- Tabela principal de imóveis
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    condominio NUMERIC DEFAULT 0,
    url TEXT NOT NULL,
    image TEXT,
    rooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    area INTEGER DEFAULT 0,
    location TEXT,
    neighborhood TEXT,
    zone TEXT,
    description TEXT,
    source TEXT NOT NULL,
    directOwner BOOLEAN DEFAULT false,
    found_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Campos geoespaciais (Fase 2/3)
    lat NUMERIC,
    lng NUMERIC,
    
    -- Scores (Fase 3/4)
    walkability_score INTEGER,
    safety_score INTEGER,
    ctm NUMERIC -- Custo Total de Moradia
);

-- Tabela de cache do Nominatim (para não estourar a API do OpenStreetMap)
CREATE TABLE geocode_cache (
    query TEXT PRIMARY KEY,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para permitir leitura anônima
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública" ON properties FOR SELECT USING (true);

-- Os scrapers usarão a chave de SERVIÇO (Service Role) para inserir/atualizar dados
-- Portanto, não precisamos de política de escrita pública.
