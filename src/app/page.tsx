import { ClientPropertyBrowser } from '../components/ClientPropertyBrowser';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'House Searcher | Aluguel em conta no Rio de Janeiro',
    description: 'Encontre os melhores imóveis para alugar no Rio de Janeiro (até R$ 1.000). Buscamos anúncios na OLX, ZAP e VivaReal automaticamente a cada 6 horas.',
    alternates: {
        canonical: 'https://house-seacher.vcampos.dev/'
    }
};

export default function Home() {
    return <ClientPropertyBrowser />;
}
