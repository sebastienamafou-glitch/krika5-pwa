// src/app/login/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/war-room'); // Redirection vers le futur dashboard
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
        
        <div className="flex flex-col items-center mb-8">
          <Image 
            src="/icon-512x512.png" 
            alt="Logo KRIKA'5" 
            width={120} 
            height={120} 
            className="mb-4 drop-shadow-lg rounded-xl"
            priority
          />
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Espace Staff</h1>
          <p className="text-slate-400 font-medium">Connectez-vous pour accéder au back-office</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Identifiant (Téléphone)</label>
            <input 
              name="phone" 
              type="text" 
              required 
              placeholder="ex: admin"
              className="w-full bg-slate-950 border border-white/10 rounded-xl h-14 px-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Mot de passe</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-white/10 rounded-xl h-14 px-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center bg-red-500/10 py-2 rounded-lg">{error}</p>}

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl text-lg mt-4"
          >
            {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <Lock className="mr-2 h-5 w-5" /> Connexion sécurisée
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
