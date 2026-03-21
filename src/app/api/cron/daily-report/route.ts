import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sgMail from '@sendgrid/mail';
import { startOfDay, endOfDay } from 'date-fns';

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

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: 'PAID'
      },
      include: { items: { include: { product: true } } }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;

    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    // Agrégation des produits vendus avec typage strict
    const productStats = orders.flatMap(o => o.items).reduce((acc: AggregatedItem[], item) => {
      const existing = acc.find(i => i.name === item.product.name);
      if (existing) {
        existing.qty += item.quantity;
      } else {
        acc.push({ name: item.product.name, qty: item.quantity });
      }
      return acc;
    }, []);

    const msg = {
      to: 'sebastien.amafou@gmail.com',
      from: 'noreply@webappci.com',
      subject: `📊 Rapport Journalier KRIKA&apos;5 - ${today.toLocaleDateString('fr-FR')}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #e11d48; text-align: center;">KRIKA&apos;5 RAPPORT</h2>
          <div style="display: flex; justify-content: space-around; background: #fdf2f2; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <div style="text-align: center;">
              <p style="font-size: 12px; color: #666;">CHIFFRE D&apos;AFFAIRES</p>
              <p style="font-size: 24px; font-weight: bold; color: #16a34a;">${totalRevenue.toLocaleString()} FCFA</p>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 12px; color: #666;">COMMANDES PAYÉES</p>
              <p style="font-size: 24px; font-weight: bold;">${totalOrders}</p>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f8f8f8;">
              <th style="padding: 10px; text-align: left;">Produit</th>
              <th style="padding: 10px; text-align: right;">Qté</th>
            </tr>
            ${productStats.map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">x${item.qty}</td>
              </tr>
            `).join('')}
          </table>
          <p style="margin-top: 30px; font-size: 10px; color: #999; text-align: center;">Généré automatiquement par KRIKA&apos;5 War Room</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true, revenue: totalRevenue });

  } catch {
    return NextResponse.json({ success: false, error: 'Erreur lors de la génération du rapport' }, { status: 500 });
  }
}
