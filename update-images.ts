// update-images.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️ Injection des images Premium en cours...');

  const imageMap: Record<string, string> = {
    'Menu Garba "Clean"': 'https://images.unsplash.com/photo-1626804475297-41607ea0d4eb?auto=format&fit=crop&w=800&q=80', // Poisson frit appétissant
    'Menu Smash Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    'Menu Mini-Chawarma': 'https://images.unsplash.com/photo-1646754067167-17eb48a97577?auto=format&fit=crop&w=800&q=80',
    'Menu Duo Mini-Pizzas': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    'Bissap Maison': 'https://images.unsplash.com/photo-1615478503562-ec2d8aa0e24e?auto=format&fit=crop&w=800&q=80', // Jus rouge intense
    'fantai': 'https://images.unsplash.com/photo-1595981267035-7b04d84b5226?auto=format&fit=crop&w=800&q=80', // Jus gingembre/citron
    'Coca-Cola (33cl)': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
  };

  const products = await prisma.product.findMany();

  for (const product of products) {
    if (imageMap[product.name]) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: imageMap[product.name] },
      });
    }
  }

  console.log('✅ Images ajoutées avec succès à la base de données !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
