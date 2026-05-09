// src/app/api/cron/daily-report/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sgMail from '@sendgrid/mail';
import { startOfDay, endOfDay } from 'date-fns';
import { PaymentMethodType } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface AggregatedItem {
  name: string;
  qty: number;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Non autorisé', { status: 401 });
  }

  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // 1. RÉCUPÉRATION DES DONNÉES (Commandes et Shifts de la journée)
    const [orders, closedShifts] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end }, paymentStatus: 'PAID' },
        include: { items: { include: { product: true } } }
      }),
      prisma.cashShift.findMany({
        where: { closedAt: { gte: start, lte: end }, status: 'CLOSED' },
        include: { operator: { select: { phone: true } } }
      })
    ]);

    // 2. ANALYSE FINANCIÈRE
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // Ventilation par méthode de paiement (CASH vs MOBILE_MONEY vs LIVREUR)
    const revenueByMethod = orders.reduce((acc, o) => {
      acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.totalAmount;
      return acc;
    }, {} as Record<PaymentMethodType, number>);

    // Calcul des écarts de caisse (Audit Zero Trust)
    const shiftMetrics = closedShifts.reduce((acc, s) => {
      acc.totalExpected += s.expectedCash;
      acc.totalActual += s.actualCash || 0;
      return acc;
    }, { totalExpected: 0, totalActual: 0 });

    const totalDelta = shiftMetrics.totalActual - shiftMetrics.totalExpected;

    // 3. STATISTIQUES PRODUITS
    const productStats = orders.flatMap(o => o.items).reduce((acc: AggregatedItem[], item) => {
      const existing = acc.find(i => i.name === item.product.name);
      if (existing) existing.qty += item.quantity;
      else acc.push({ name: item.product.name, qty: item.quantity });
      return acc;
    }, []);

    // 4. ENVOI DU RAPPORT (SENDGRID)
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    const msg = {
      to: 'sebastien.amafou@gmail.com',
      from: 'noreply@webappci.com',
      subject: `📊 Rapport Audit KRIKA'5 - ${today.toLocaleDateString('fr-FR')}`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 20px;">
          <h2 style="color: #f5a623; text-align: center; font-weight: 900; letter-spacing: -1px;">KRIKA'5 WAR ROOM</h2>
          
          <div style="background: #0f172a; color: white; padding: 20px; border-radius: 15px; margin-bottom: 25px; text-align: center;">
            <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">Chiffre d'Affaires Global</p>
            <p style="font-size: 32px; font-weight: 900; margin: 0;">${totalRevenue.toLocaleString()} <span style="font-size: 14px;">FCFA</span></p>
          </div>

          <h3 style="font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">🛡️ Audit de Caisse (Shifts)</h3>
          <div style="display: flex; gap: 10px; margin-bottom: 20px; padding: 15px; background: ${totalDelta === 0 ? '#f0fdf4' : '#fef2f2'}; border-radius: 12px;">
            <div style="flex: 1; text-align: center;">
              <p style="font-size: 10px; color: #64748b;">ATTENDU</p>
              <p style="font-weight: bold;">${shiftMetrics.totalExpected.toLocaleString()} F</p>
            </div>
            <div style="flex: 1; text-align: center;">
              <p style="font-size: 10px; color: #64748b;">RÉEL</p>
              <p style="font-weight: bold;">${shiftMetrics.totalActual.toLocaleString()} F</p>
            </div>
            <div style="flex: 1; text-align: center;">
              <p style="font-size: 10px; color: #64748b;">ÉCART</p>
              <p style="font-weight: bold; color: ${totalDelta < 0 ? '#ef4444' : '#10b981'};">${totalDelta > 0 ? '+' : ''}${totalDelta.toLocaleString()} F</p>
            </div>
          </div>

          <h3 style="font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">💰 Modes de Paiement</h3>
          <div style="margin-bottom: 25px;">
            <p style="font-size: 13px;"><b>Espèces :</b> ${ (revenueByMethod['CASH'] || 0).toLocaleString() } F</p>
            <p style="font-size: 13px;"><b>Mobile Money :</b> ${ (revenueByMethod['MOBILE_MONEY'] || 0).toLocaleString() } F</p>
            <p style="font-size: 13px;"><b>Livreurs (Cash) :</b> ${ (revenueByMethod['CASH_DELIVERY'] || 0).toLocaleString() } F</p>
          </div>

          <h3 style="font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">🔥 Top Ventes</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${productStats.map(item => `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px;">${item.name}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold;">x${item.qty}</td>
              </tr>
            `).join('')}
          </table>

          <p style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; font-weight: bold;">
            GÉNÉRÉ PAR LE SYSTÈME KRIKA'5 • ${new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true, delta: totalDelta });

  } catch (error) {
    console.error("Erreur Cron Report:", error);
    return NextResponse.json({ success: false, error: 'Échec du rapport' }, { status: 500 });
  }
}
