// src/app/admin/create/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  UserPlus, 
  ShieldAlert, 
  Phone, 
  KeyRound, 
  Loader2, 
  ChefHat, 
  UserCog 
} from 'lucide-react';
import { createStaffUser } from '@/actions/admin';
import { Role } from '@prisma/client';

export default function CreateAdminPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(Role.STAFF);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    
    // On extrait les données du formulaire
    const formData = new FormData(event.currentTarget);
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;

    // On crée l'objet typé attendu par la Server Action
    const payload = {
      phone,
      password,
      role
    };

    startTransition(async () => {
      // On envoie l'objet strict, et non plus le FormData brut
      const result = await createStaffUser(payload);
      
      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || "Une erreur est survenue.");
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 flex flex-col items-center justify-center text-white">
      
      <div className="w-full max-w-xl">
        <Link href="/admin" className="inline-flex items-center text-slate-500 hover:text-white mb-8 font-bold transition-colors group text-sm uppercase tracking-widest">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Retour à la configuration
        </Link>

        <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-[2.5rem] p-8 md:p-12">
          
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Nouveau Compte</h1>
              <p className="text-slate-400 font-medium text-sm mt-1">Générez un accès sécurisé pour votre équipe.</p>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm font-bold">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Identifiant de connexion (Téléphone)
              </label>
              <input 
                type="tel" 
                name="phone" 
                required
                placeholder="Ex: 0102030405"
                disabled={isPending}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-primary outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Mot de passe
              </label>
              <input 
                type="password" 
                name="password" 
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
                disabled={isPending}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-primary outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Niveau de permissions
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole(Role.STAFF)}
                  disabled={isPending}
                  className={`flex-1 flex flex-col items-center justify-center p-5 rounded-2xl border transition-all ${role === Role.STAFF ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-900/20' : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/20'}`}
                >
                  <ChefHat className="w-6 h-6 mb-2" />
                  <span className="font-black text-xs uppercase tracking-widest">Personnel (Staff)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole(Role.ADMIN)}
                  disabled={isPending}
                  className={`flex-1 flex flex-col items-center justify-center p-5 rounded-2xl border transition-all ${role === Role.ADMIN ? 'bg-pink-500/10 border-pink-500 text-pink-400 shadow-lg shadow-pink-900/20' : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/20'}`}
                >
                  <UserCog className="w-6 h-6 mb-2" />
                  <span className="font-black text-xs uppercase tracking-widest">Administrateur</span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full py-5 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Créer le compte</>}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
