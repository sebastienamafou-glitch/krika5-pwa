// src/components/Footer.tsx
import Link from 'next/link';
import Image from 'next/image';
import { BRAND_NAME } from '@/lib/constants';
import { Facebook, Instagram, Phone, Mail } from 'lucide-react'; // Ajout d'icônes

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-950 border-t border-white/10 mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center">
        
        {/* SECTION 1 : LOGO + TEXTE ACCROCHE */}
        <div className="flex flex-col items-center mb-10 text-center">
          {/* Implémentation exacte et blindée de la Landing/Hub Page */}
          <Image 
            src="/icon-512x512.png" 
            alt={`Logo ${BRAND_NAME}`} 
            width={80} // Taille ajustée pour le footer
            height={80} 
            className="mb-6 drop-shadow-2xl rounded-3xl"
            priority
          />
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-1.5">
            KRIKA<span className="text-primary">&apos;</span>5
          </h2>
          <p className="text-slate-400 mt-3 text-sm font-medium leading-relaxed italic max-w-sm">
            L&apos;art du Tacos & Burgers Premium au cœur d&apos;Abidjan.<br/>Qualité. Fraîcheur. Vitesse.
          </p>
        </div>

        {/* SECTION 2 : NAVIGATION + RÉSEAUX + CONTACTS (Amélioration UI) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-t border-b border-white/5 mb-8">
          
          {/* Navigation */}
          <div className="flex flex-col items-center md:items-start space-y-3">
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Explorer</h4>
            <Link href="/carte" className="text-slate-500 hover:text-white transition-colors text-sm font-bold">Notre Carte</Link>
            <Link href="/fidelite" className="text-slate-500 hover:text-white transition-colors text-sm font-bold">La Fidelité</Link>
            <Link href="/contact" className="text-slate-500 hover:text-white transition-colors text-sm font-bold">Nous Contacter</Link>
          </div>

          {/* Réseaux Sociaux */}
          <div className="flex flex-col items-center space-y-3">
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Nous suivre</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact (Nouveau) */}
          <div className="flex flex-col items-center md:items-end space-y-3">
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Commandes</h4>
            <a href="tel:0102030405" className="flex items-center gap-2 text-primary font-black text-lg">
                <Phone className="w-5 h-5" /> 01.02.03.04.05
            </a>
            <a href="mailto:contact@krika5.com" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold">
                <Mail className="w-4 h-4" /> contact@krika5.com
            </a>
          </div>
        </div>

        {/* SECTION 3 : COPYRIGHT + SIGNATURE PREMIUM */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 text-center">
          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
            &copy; {currentYear} <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />. Tous droits réservés.
          </p>
          
          {/* Signature webapp.ci blindée et premium */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-white/5 shadow-inner">
            <span className="text-slate-600 text-[10px] font-medium uppercase tracking-widest">Powered by</span>
            <Image 
              src="/logo-webappci.png" // Utilisation du logo PWA circulaire
              alt="Logo webapp.ci" 
              width={25} 
              height={25} 
              className="drop-shadow-lg rounded-md"
            />
            <Link href="https://webappci.com" className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                webapp.ci
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
