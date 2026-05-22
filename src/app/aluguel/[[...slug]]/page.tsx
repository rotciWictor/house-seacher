import { Metadata } from 'next';
import { ClientPropertyBrowser } from '../../../components/ClientPropertyBrowser';

interface PageProps {
    params: {
        slug?: string[];
    };
}

const capitalize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export const dynamicParams = true; // ISR fallback para rotas não listadas

export async function generateStaticParams() {
    // Renderiza estaticamente apenas as rotas raiz de Zonas no momento do Build para evitar timeout.
    // Os bairros detalhados serão cacheados via ISR (sob demanda) na primeira vez que o Googlebot acessar.
    return [
        { slug: [] },
        { slug: ['zona-sul'] },
        { slug: ['zona-norte'] },
        { slug: ['zona-oeste'] },
        { slug: ['centro'] },
        { slug: ['baixada'] },
        { slug: ['niteroi'] },
        { slug: ['sao-goncalo'] },
    ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const slug = params.slug || [];
    const zone = slug[0] ? capitalize(slug[0]) : '';
    const neighborhood = slug[1] ? capitalize(slug[1]) : '';

    let title = 'House Searcher | Aluguel em conta no Rio de Janeiro';
    let description = 'Encontre os melhores imóveis para alugar no Rio de Janeiro (até R$ 1.000).';
    
    if (neighborhood) {
        title = `Aluguel em ${neighborhood}, ${zone} (RJ) até R$ 1.000 | House Searcher`;
        description = `As melhores opções de aluguel barato em ${neighborhood}. Casas, apartamentos e kitnets até R$ 1.000 na ${zone}, Rio de Janeiro.`;
    } else if (zone) {
        title = `Aluguel na ${zone} (RJ) até R$ 1.000 | House Searcher`;
        description = `Imóveis para alugar na ${zone} do Rio de Janeiro. Encontre opções diretas com proprietário e os melhores preços até R$ 1.000.`;
    }

    return {
        title,
        description,
        alternates: {
            canonical: `https://house-seacher.vcampos.dev/aluguel/${slug.join('/')}`
        },
        openGraph: {
            title,
            description,
            type: 'website',
        }
    };
}

export default function AluguelDynamicPage({ params }: PageProps) {
    const slug = params.slug || [];
    const initialZone = slug[0];
    const initialNeighborhood = slug[1];

    // The script for JSON-LD could also be generated here dynamically
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: params.slug ? `Aluguel em ${capitalize(params.slug.join(', '))}` : 'Aluguel no Rio de Janeiro',
        description: 'Buscador de imóveis baratos',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ClientPropertyBrowser initialZone={initialZone} initialNeighborhood={initialNeighborhood} />
        </>
    );
}
