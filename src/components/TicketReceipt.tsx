// src/components/TicketReceipt.tsx
import React from 'react';

export type TicketItem = {
  name: string;
  quantity: number;
  price: number;
};

export type TicketProps = {
  orderId: string;
  date: Date;
  items: TicketItem[];
  total: number;
  paymentMethod: string;
};

export function TicketReceipt({ orderId, date, items, total, paymentMethod }: TicketProps) {
  return (
    <div id="printable-ticket" className="hidden print:block text-black bg-white w-[80mm] text-sm font-mono leading-tight">
      {/* En-tête */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-2xl uppercase">KRIKA&apos;5</h1>
        <p className="text-xs mt-1">Abidjan, Côte d&apos;Ivoire</p>
        <p className="text-xs">Tél: +225 00 00 00 00</p>
      </div>

      {/* Méta-données de la commande */}
      <div className="border-b border-black border-dashed pb-2 mb-2 text-xs">
        <p>Ticket : #{orderId.split('-')[0].toUpperCase()}</p>
        <p>Date : {date.toLocaleDateString('fr-FR')} {date.toLocaleTimeString('fr-FR')}</p>
      </div>

      {/* Lignes d&apos;articles */}
      <table className="w-full text-xs mb-2">
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="text-left pb-1 w-8">QTE</th>
            <th className="text-left pb-1">DÉSIGNATION</th>
            <th className="text-right pb-1">PRIX</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="align-top py-1 font-bold">{item.quantity}x</td>
              <td className="align-top py-1 pr-2 uppercase">{item.name}</td>
              <td className="align-top text-right py-1">{(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total et Paiement */}
      <div className="border-t border-black border-dashed pt-2 mb-6">
        <div className="flex justify-between font-bold text-base mb-1">
          <span>TOTAL</span>
          <span>{total.toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Paiement</span>
          <span className="uppercase">{paymentMethod}</span>
        </div>
      </div>

      {/* Pied de page */}
      <div className="text-center text-xs">
        <p className="font-bold">Merci de votre visite !</p>
        <p className="mt-1">À très bientôt chez KRIKA&apos;5</p>
      </div>
    </div>
  );
}
