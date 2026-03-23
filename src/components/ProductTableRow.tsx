// src/components/ProductTableRow.tsx
'use client';

import { useState, useTransition } from 'react';
import { updateProductStock, updateProduct, deleteProduct } from '@/actions/product';
import { Button } from '@/components/ui/button';
import { Loader2, Power, PowerOff, Edit, Trash2, X, Save } from 'lucide-react';

type ProductProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    isAvailable: boolean;
    categoryId: string;
  };
  categories: { id: string; name: string; }[];
};

export function ProductTableRow({ product, categories }: ProductProps) {
  // États d'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: product.name,
    price: product.price.toString(),
    description: product.description || '',
    categoryId: product.categoryId
  });

  // États opérationnels
  const [stock, setStock] = useState(product.stock);
  const [isAvailable, setIsAvailable] = useState(product.isAvailable);
  const [isPending, startTransition] = useTransition();

  const handleUpdateStock = (newStock: number, newAvailability: boolean) => {
    setStock(newStock);
    setIsAvailable(newAvailability);
    startTransition(async () => {
      await updateProductStock(product.id, newStock, newAvailability);
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProduct(product.id, {
        name: editData.name,
        price: Number(editData.price),
        description: editData.description,
        categoryId: editData.categoryId
      });
      if (res.success) setIsEditing(false);
      else alert(res.error);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Supprimer définitivement "${product.name}" ?`)) return;
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (!res.success) alert(res.error);
    });
  };

  return (
    <>
      <tr className={`border-b border-white/5 transition-colors hover:bg-white/5 ${!isAvailable ? 'opacity-50 grayscale' : ''}`}>
        <td className="px-6 py-4">
            <p className="font-bold text-white">{product.name}</p>
            {product.description && <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{product.description}</p>}
        </td>
        <td className="px-6 py-4 text-slate-300 font-medium">{product.price} F</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-full bg-slate-800 border-white/10 text-white hover:bg-slate-700" onClick={() => handleUpdateStock(Math.max(0, stock - 1), isAvailable)} disabled={isPending}>-</Button>
            <span className="w-8 text-center font-black text-white text-lg">{stock}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-full bg-slate-800 border-white/10 text-white hover:bg-slate-700" onClick={() => handleUpdateStock(stock + 1, isAvailable)} disabled={isPending}>+</Button>
          </div>
        </td>
        <td className="px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => handleUpdateStock(stock, !isAvailable)} disabled={isPending} className={isAvailable ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-red-500 hover:text-red-400 hover:bg-red-500/10"}>
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : isAvailable ? <Power className="h-6 w-6" /> : <PowerOff className="h-6 w-6" />}
          </Button>
        </td>
        <td className="px-6 py-4 text-right flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={isPending} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
            <Edit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-5 w-5" />
          </Button>
        </td>
      </tr>

      {/* MODALE D'ÉDITION (Injectée dans le DOM uniquement si active) */}
      {isEditing && (
        <tr>
          <td colSpan={5} className="p-0 border-0">
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl p-8 relative shadow-2xl">
                <button onClick={() => setIsEditing(false)} className="absolute right-6 top-6 text-slate-500 hover:text-white"><X /></button>
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><Edit className="text-blue-400" /> Modifier le Produit</h3>
                
                <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom du produit</label>
                    <input type="text" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Description (Optionnel)</label>
                    <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none min-h-[80px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Prix (FCFA)</label>
                      <input type="number" required min="0" value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Catégorie</label>
                      <select required value={editData.categoryId} onChange={e => setEditData({...editData, categoryId: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none appearance-none">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button disabled={isPending} type="submit" className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                    {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5"/> Enregistrer les modifications</>}
                  </button>
                </form>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
