import { MetadataRoute } from 'next';
import { supabase } from '../lib/supabase';
import { slugify } from '../utils/format';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://house-seacher.vcampos.dev';
    
    // Core URLs
    const routes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1.0,
        },
    ];

    try {
        const { data } = await supabase.from('properties').select('zone, neighborhood');
        
        if (data) {
            const uniqueRoutes = new Set<string>();
            const zoneMap = new Set<string>();

            data.forEach(p => {
                if (!p.zone || !p.neighborhood || p.zone === 'Geral' || p.neighborhood === 'Desconhecido') return;
                
                const zSlug = slugify(p.zone);
                const nSlug = slugify(p.neighborhood);
                
                zoneMap.add(zSlug);
                uniqueRoutes.add(`${zSlug}/${nSlug}`);
            });

            zoneMap.forEach(z => {
                routes.push({
                    url: `${baseUrl}/aluguel/${z}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily',
                    priority: 0.8,
                });
            });

            uniqueRoutes.forEach(route => {
                routes.push({
                    url: `${baseUrl}/aluguel/${route}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily',
                    priority: 0.6,
                });
            });
        }
    } catch (e) {
        console.error('Error generating dynamic sitemap', e);
    }

    return routes;
}
