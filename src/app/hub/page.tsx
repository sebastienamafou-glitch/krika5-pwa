// src/app/hub/page.tsx
import Link from 'next/link';
import { Store, ChefHat, Settings, LayoutDashboard } from 'lucide-react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

export default async function HubPage() {
  // Optionnel mais recommandé : Vérifier le rôle pour cacher le bouton Admin au Staff
  let userRole = 'STAFF';
  try {
    const token = cookies().get('kds_session')?.value;
    if (token) {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      userRole = payload.role as string;
    }
  } catch {
    // Si pas de session valide, le middleware s'occupera de rediriger vers /login
  }

  const modules = [
    {
      title: "Caisse (POS)",
      description: "Prise de commande et encaissement",
      href: "/war-room/pos",
      icon: <Store className="w-12 h-12 mb-4 text-orange-400" />,
      color: "hover:border-orange-500/50 hover:bg-orange-500/10",
    },
    {
      title: "Écran Cuisine (KDS)",
      description: "Gestion des commandes en cours",
      href: "/kds",
      icon: <ChefHat className="w-12 h-12 mb-4 text-emerald-400" />,
      color: "hover:border-emerald-500/50 hover:bg-emerald-500/10",
    },
    {
      title: "Catalogue",
      description: "Gestion des produits et stocks",
      href: "/war-room/catalogue",
      icon: <LayoutDashboard className="w-12 h-12 mb-4 text-blue-400" />,
      color: "hover:border-blue-500/50 hover:bg-blue-500/10",
    }
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Portail <span className="text-primary">KRIKA&apos;5</span></h1>
          <p className="text-slate-400 mt-4 text-lg">Sélectionnez votre espace de travail.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <Link key={mod.href} href={mod.href} className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-white/10 bg-slate-900 transition-all duration-300 group ${mod.color}`}>
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                {mod.icon}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{mod.title}</h2>
              <p className="text-sm text-slate-400">{mod.description}</p>
            </Link>
          ))}
          
          {/* Le bouton Admin n'apparaît que pour les administrateurs */}
          {userRole === 'ADMIN' && (
            <Link href="/admin" className="flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-white/10 bg-slate-900 transition-all duration-300 group hover:border-purple-500/50 hover:bg-purple-500/10 md:col-span-3 lg:col-span-1">
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-12 h-12 mb-4 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Administration</h2>
              <p className="text-sm text-slate-400">Gestion des accès et paramètres</p>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
