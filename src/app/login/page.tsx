// src/app/login/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  
  // État pour la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/hub');
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
        
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-slate-800/50 rounded-3xl border border-white/5 mb-4 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <Image 
              src="/icon-512x512.png" 
              alt="Logo KRIKA'5" 
              width={100} 
              height={100} 
              className="drop-shadow-lg rounded-xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Espace Staff</h1>
          <p className="text-slate-400 font-medium">Accès sécurisé KRIKA&apos;5</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Identifiant</label>
            <input 
              name="phone" 
              type="text" 
              required 
              placeholder="ex: admin"
              className="w-full bg-slate-950 border border-white/10 rounded-xl h-14 px-4 text-white focus:outline-none focus:border-primary transition-colors font-medium"
            />
          </div>
          
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Mot de passe</label>
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/10 rounded-xl h-14 pl-4 pr-12 text-white focus:outline-none focus:border-primary transition-colors font-medium"
              />
              {/* Bouton de visibilité */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                tabIndex={-1} // Évite de casser la navigation au clavier (Tab)
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-xl text-lg mt-2 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
          >
            {isPending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> 
                <span>CONNEXION</span>
              </div>
            )}
          </Button>
        </form>
      </div>
      
      <p className="mt-8 text-slate-600 text-xs font-bold uppercase tracking-[0.3em]">
        Propriété de KRIKA&apos;5
      </p>
    </main>
  );
}
