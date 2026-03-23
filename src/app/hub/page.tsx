// src/app/hub/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Store, ChefHat, Settings, Utensils, LogOut, Bike, BookOpen } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { BRAND_NAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

export default async function HubPage() {
  let userRole = 'STAFF';
  try {
    const token = cookies().get('kds_session')?.value;
    if (token) {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      userRole = payload.role as string;
    }
  } catch { /* Redirection gérée par le middleware */ }

  // Action Serveur : Destruction sécurisée de la session
  async function handleLogout() {
    'use server';
    cookies().delete('kds_session');
    redirect('/login'); // Redirige vers ta page d'authentification
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
      description: "Stocks et disponibilité produits",
      href: "/war-room/catalogue",
      icon: <Utensils className="w-12 h-12 mb-4 text-blue-400" />,
      color: "hover:border-blue-500/50 hover:bg-blue-500/10",
    },
    {
      title: "Expédition (Livreur)",
      description: "Courses en attente et GPS",
      href: "/livraison",
      icon: <Bike className="w-12 h-12 mb-4 text-purple-400" />,
      color: "hover:border-purple-500/50 hover:bg-purple-500/10",
    },
    {
      title: "Menu Client",
      description: "Aperçu de la carte en temps réel",
      href: "/carte",
      icon: <BookOpen className="w-12 h-12 mb-4 text-cyan-400" />,
      color: "hover:border-cyan-500/50 hover:bg-cyan-500/10",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 flex flex-col items-center relative">
      
      {/* BOUTON DÉCONNEXION */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10">
        <form action={handleLogout}>
          <button 
            type="submit" 
            className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all text-xs uppercase tracking-widest shadow-lg shadow-red-900/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Déconnexion</span>
          </button>
        </form>
      </div>

      {/* SECTION LOGO + TITRE */}
      <header className="mb-12 text-center flex flex-col items-center mt-12 md:mt-0">
        <Image 
          src="/icon-512x512.png" 
          alt={`Logo ${BRAND_NAME}`} 
          width={140} 
          height={140} 
          className="mb-8 drop-shadow-2xl rounded-3xl"
          priority
        />
        
        <h1 className="text-4xl font-black text-white tracking-tight">
          Portail <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
        </h1>
        <p className="text-slate-500 mt-2 font-medium uppercase tracking-[0.2em] text-xs">
          Système de Gestion Opérationnel
        </p>
      </header>

      {/* GRILLE DES MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {modules.map((mod) => (
          <Link 
            key={mod.href} 
            href={mod.href} 
            className={`flex flex-col items-center justify-center text-center p-10 rounded-[2.5rem] border border-white/5 bg-slate-900/50 backdrop-blur-sm transition-all duration-500 group ${mod.color} hover:-translate-y-2`}
          >
            <div className="transform group-hover:scale-110 transition-transform duration-500 ease-out">
              {mod.icon}
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{mod.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">{mod.description}</p>
          </Link>
        ))}
        
        {userRole === 'ADMIN' && (
          <Link 
            href="/admin" 
            className="flex flex-col items-center justify-center text-center p-10 rounded-[2.5rem] border border-white/5 bg-slate-900/50 backdrop-blur-sm transition-all duration-500 group hover:border-purple-500/50 hover:bg-purple-500/10 md:col-span-2 lg:col-span-1 hover:-translate-y-2"
          >
            <div className="transform group-hover:scale-110 transition-transform duration-500 ease-out">
              <Settings className="w-12 h-12 mb-4 text-purple-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Configuration</h2>
            <p className="text-sm text-slate-500 leading-relaxed">Administration & Accès Staff</p>
          </Link>
        )}
      </div>

      <footer className="mt-auto pt-12 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
        Version 2.0.4 &mdash; Build Stable
      </footer>
    </main>
  );
}
