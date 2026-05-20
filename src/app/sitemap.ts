import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://house-seacher.vcampos.dev',
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1,
        },
    ];
}
