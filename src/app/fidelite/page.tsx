// src/app/fidelite/page.tsx
'use client';

import { useState, useTransition } from 'react';
import QRCode from 'react-qr-code';
import { getLoyaltyProfile } from '@/actions/loyalty';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, Smartphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BRAND_NAME } from '@/lib/constants';

type LoyaltyData = {
  id: string;
  points: number;
};

export default function LoyaltyPage() {
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState<LoyaltyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await getLoyaltyProfile(phone);
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError(result.error || "Une erreur est survenue.");
      }
    });
  };

  const resetLookup = () => {
    setProfile(null);
    setPhone("");
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* En-tête de la carte */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt={`Logo ${BRAND_NAME}`} 
            width={80} 
            height={80} 
            className="mb-4 drop-shadow-2xl rounded-2xl" 
            priority 
          />
          <h1 className="text-3xl font-black text-white tracking-tight">
            {/* Utilisation de la constante BRAND_NAME */}
            <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
            <span className="text-primary">Club</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">10 commandes = 1 menu offert</p>
        </div>

        {!profile ? (
          <form onSubmit={handleLookup} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Votre numéro de téléphone
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 0102030405"
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-white text-lg placeholder-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-center tracking-widest"
                disabled={isPending}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isPending || phone.length < 8}
              className="h-14 w-full rounded-xl bg-primary text-lg font-bold text-white transition-all hover:bg-orange-600 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : "Afficher ma carte"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold text-white mb-4">
               <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} /> Club
            </h2>
            
            <div className="w-full mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-400">Progression</span>
                <span className="text-2xl font-black text-primary">{profile.points} / 10</span>
              </div>
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((profile.points / 10) * 100, 100)}%` }}
                />
              </div>
              {profile.points >= 10 && (
                <p className="text-emerald-400 font-bold text-sm text-center mt-3 animate-pulse">
                  🎉 Félicitations ! Votre prochaine commande est offerte !
                </p>
              )}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
              <QRCode 
                value={profile.id} 
                size={200}
                level="H" 
                className="w-full h-auto"
              />
            </div>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2 mb-6">
              <QrCode className="w-4 h-4" /> Présentez ce code en caisse
            </p>

            <button 
              onClick={resetLookup}
              className="text-slate-500 hover:text-white transition-colors text-sm font-medium underline underline-offset-4"
            >
              Ceci n&apos;est pas mon numéro
            </button>
          </div>
        )}
      </div>

      <Link href="/" className="mt-8 text-primary font-bold hover:underline underline-offset-4">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
