// src/app/admin/page.tsx
import { prisma } from '@/lib/prisma';
import { CreateStaffForm } from '@/components/CreateStaffForm';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { deleteStaffUser } from '@/actions/admin';
import { BRAND_NAME } from '@/lib/constants'; //

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Requête sécurisée côté serveur : on exclut les clients (CUSTOMER)
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
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <header className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-black text-white tracking-tight">Administration</h1>
        {/* Application de la méthode DRY */}
        <div className="text-slate-400 mt-2 font-medium text-lg flex items-center gap-1">
          Gestion des accès et configuration <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Colonne Gauche : Formulaire de création */}
        <div className="sticky top-6">
          <CreateStaffForm />
        </div>

        {/* Colonne Droite : Tableau des accès */}
        <div className="lg:col-span-2 bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-slate-800/30">
            <h2 className="text-xl font-bold text-white">Comptes Autorisés</h2>
            <p className="text-sm text-slate-400 mt-1">Liste du personnel ayant accès au Back-Office ou à la Caisse.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Téléphone</th>
                  <th className="px-6 py-4 font-bold">Rôle</th>
                  <th className="px-6 py-4 font-bold">Date d&apos;ajout</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">
                      Aucun compte membre trouvé.
                    </td>
                  </tr>
                ) : (
                  staffUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{user.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          user.role === 'ADMIN' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/20' 
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                        }`}>
                          {user.role === 'ADMIN' ? <ShieldAlert className="w-3 h-3 mr-1" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* Correction de l'Action Serveur pour éviter l'erreur de type */}
                        <form action={async () => {
                          'use server';
                          await deleteStaffUser(user.id);
                        }}>
                          <button 
                            type="submit" 
                            className="text-slate-500 hover:text-red-400 transition-colors font-medium text-xs uppercase tracking-wider"
                          >
                            Révoquer
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
