// src/app/admin/page.tsx
import { prisma } from '@/lib/prisma';
import { CreateStaffForm } from '@/components/CreateStaffForm';
import { ShieldAlert, ShieldCheck, ArrowLeft, Trash2 } from 'lucide-react';
import { deleteStaffUser } from '@/actions/admin';
import { BRAND_NAME } from '@/lib/constants';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const staffUsers = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'STAFF'] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      phone: true,
      role: true,
      createdAt: true,
    }
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white">
      <header className="mb-10 border-b border-white/10 pb-6">
        <Link href="/hub" className="inline-flex items-center text-slate-500 hover:text-white mb-6 font-bold transition-colors group text-sm uppercase tracking-widest">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Retour au Hub
        </Link>
        
        <h1 className="text-4xl font-black text-white tracking-tight">Administration</h1>
        <div className="text-slate-400 mt-2 font-medium text-lg flex items-center gap-1">
          Gestion des accès et configuration <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="sticky top-6">
          <CreateStaffForm />
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-white/5 bg-slate-800/30">
            <h2 className="text-2xl font-black text-white tracking-tight">Comptes Autorisés</h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">Liste du personnel ayant accès au Back-Office ou à la Caisse.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                <tr>
                  <th className="px-8 py-5">Téléphone</th>
                  <th className="px-8 py-5">Rôle</th>
                  <th className="px-8 py-5">Date d&apos;ajout</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {staffUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-slate-500 font-medium">
                      Aucun compte membre trouvé.
                    </td>
                  </tr>
                ) : (
                  staffUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-5 font-bold text-white">{user.phone}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-widest border ${
                          user.role === 'ADMIN' 
                            ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {user.role === 'ADMIN' ? <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {/* Structure propre, Next.js est satisfait */}
                        <form action={deleteStaffUser}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button 
                            type="submit" 
                            className="text-slate-600 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-500/10 flex items-center justify-end w-full gap-2 text-xs font-bold uppercase tracking-widest"
                            title="Révoquer l'accès"
                          >
                            <Trash2 className="w-4 h-4" /> Révoquer
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
