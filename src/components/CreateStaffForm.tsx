// src/components/CreateStaffForm.tsx
'use client';

import { useState, useTransition, useRef } from 'react';
import { createStaffUser } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import { Role } from '@prisma/client';

export function CreateStaffForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;

    startTransition(async () => {
      const result = await createStaffUser({ phone, password, role });
      
      if (result.success) {
        setMessage({ type: 'success', text: "Utilisateur créé avec succès." });
        formRef.current?.reset();
      } else {
        setMessage({ type: 'error', text: result.error || "Erreur lors de la création." });
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col gap-5 max-w-md">
      <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-white">Nouvel Accès</h2>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-400">Numéro de téléphone</label>
        <input 
          type="tel" 
          name="phone"
          required
          placeholder="Ex: 0102030405"
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-400">Mot de passe</label>
        <input 
          type="password" 
          name="password"
          required
          placeholder="••••••••"
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        {/* Correction ESLint : d'accès -> d&apos;accès */}
        <label className="text-sm font-medium text-slate-400">Rôle (Niveau d&apos;accès)</label>
        <select 
          name="role"
          required
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={isPending}
        >
          <option value="STAFF">Staff (Caisse / Cuisine)</option>
          <option value="ADMIN">Administrateur (Contrôle total)</option>
        </select>
      </div>

      <Button 
        type="submit" 
        disabled={isPending}
        className="mt-4 h-12 w-full rounded-xl bg-primary text-base font-bold text-white transition-all hover:bg-primary/80 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
        {isPending ? "Création en cours..." : "Créer l&apos;utilisateur"}
      </Button>
    </form>
  );
}
