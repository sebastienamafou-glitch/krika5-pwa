// src/app/page.tsx
import { ProductCard } from '@/components/ProductCard';
import { CartHeader } from '@/components/CartHeader';

// Mock Data stricte basée sur ton schéma Prisma
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Menu Garba "Clean"',
    description: 'Attiéké frais, Thon frit calibré (80g), Piment frais & Oignons. Hygiène garantie.',
    price: 1500,
    imageUrl: null, // Remplacer par l'URL Supabase plus tard
  },
  {
    id: '2',
    name: 'Menu Smash Burger',
    description: 'Pain Brioché, Bœuf Smashé (60g), Cheddar fondant, Oignons grillés, Sauce Krika.',
    price: 1500,
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Menu Mini-Chawarma',
    description: 'Pain Pita, Poulet Mariné grillé, Crudités croquantes, Crème d\'ail onctueuse.',
    price: 1500,
    imageUrl: null,
  },
  {
    id: '4',
    name: 'Menu Duo Mini-Pizzas',
    description: 'Deux mini-pizzas : 1 Reine (Jambon/Fromage) + 1 Trois Fromages. Croustillantes.',
    price: 1500,
    imageUrl: null,
  },
  {
    id: '5',
    name: 'Menu Wrap Tenders Crispy',
    description: 'Pain Pita, 2 Tenders de poulet ultra-croustillants, Crudités, Sauce au choix.',
    price: 1500,
    imageUrl: null,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background pb-12">
      <CartHeader />
      
      <div className="container mx-auto px-4 pt-8">
        {/* Titre aligné sur le style du menu board */}
        <div className="mb-10 text-center border-b border-zinc-800 pb-6">
          <h2 className="text-3xl font-black tracking-widest text-white uppercase">Menu Unique</h2>
          <p className="text-4xl font-black text-primary mt-2">1500 FCFA <span className="text-lg text-white">LE MENU</span></p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              imageUrl={product.imageUrl}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
