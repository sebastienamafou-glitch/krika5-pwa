// src/app/contact/page.tsx
import { MapPin, Phone, Mail, Clock, Send, ArrowLeft } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  // Vérification silencieuse : l'utilisateur est-il un membre du staff ?
  const isStaff = cookies().has('kds_session');

  return (
    <main className="min-h-screen bg-slate-950 pt-8 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE : BOUTON RETOUR + LOGO */}
        <header className="flex items-center justify-between mb-16 border-b border-white/5 pb-6">
          <Link href={isStaff ? "/hub" : "/"} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors w-32">
            <ArrowLeft className="w-4 h-4" /> {isStaff ? "Hub" : "Accueil"}
          </Link>
          
          {/* Implémentation du logo nettoyé (style Landing Page / Hub) */}
          <Image 
            src="/icon-512x512.png" 
            alt={`Logo ${BRAND_NAME}`} 
            width={80} 
            height={80} 
            className="drop-shadow-2xl rounded-2xl"
            priority 
          />
          
          <div className="w-32 hidden md:block"></div> {/* Espaceur pour centrer le logo */}
        </header>

        {/* EN-TÊTE DU CONTENU */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
            Nous <span className="text-primary">Contacter</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Une question sur nos menus ? Une commande spéciale ? N&apos;hésitez pas à nous écrire ou à nous appeler. L&apos;équipe <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} /> est à votre écoute.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* INFORMATIONS DE CONTACT */}
          <div className="space-y-8">
            <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2rem] flex items-start gap-6 hover:border-primary/30 transition-colors">
              <div className="bg-primary/10 p-4 rounded-2xl shrink-0">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Téléphone</h3>
                <p className="text-slate-400 font-medium mb-1">Pour les commandes et l&apos;assistance immédiate :</p>
                <a href="tel:0102030405" className="text-2xl font-black text-white hover:text-primary transition-colors">01.02.03.04.05</a>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2rem] flex items-start gap-6 hover:border-blue-500/30 transition-colors">
              <div className="bg-blue-500/10 p-4 rounded-2xl shrink-0">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Email</h3>
                <p className="text-slate-400 font-medium mb-1">Pour les partenariats et réclamations :</p>
                <a href="mailto:contact@krika5.com" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">contact@krika5.com</a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl flex flex-col gap-3">
                <MapPin className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Notre Adresse</h3>
                <p className="text-slate-400 text-sm font-medium">
                  Cocody Riviera 2,<br />Abidjan, C&ocirc;te d&apos;Ivoire
                </p>
              </div>
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl flex flex-col gap-3">
                <Clock className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Horaires</h3>
                <p className="text-slate-400 text-sm font-medium">
                  Lun - Dim<br />11h00 - 23h30
                </p>
              </div>
            </div>
          </div>

          {/* FORMULAIRE DE CONTACT */}
          <div className="bg-slate-900 border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-wide">Envoyez-nous un message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nom complet</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Jean Dupont"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 0102030405"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sujet</label>
                <div className="relative">
                  <select className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-primary focus:outline-none transition-colors appearance-none">
                    <option value="commande">Problème avec une commande</option>
                    <option value="info">Demande d&apos;information</option>
                    <option value="partenariat">Partenariat B2B</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Votre message</label>
                <textarea 
                  placeholder="Détaillez votre demande ici..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:border-primary focus:outline-none transition-colors min-h-[150px] resize-none"
                ></textarea>
              </div>

              <button 
                type="button" 
                className="w-full py-5 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary/20"
              >
                <Send className="w-5 h-5" /> Envoyer le message
              </button>
            </form>
          </div>

        </div>
      </div>
    </main>
  );
}
