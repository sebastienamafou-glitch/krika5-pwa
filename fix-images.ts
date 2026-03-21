// fix-images.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Réparation des chemins d\'images...');

  // On va utiliser des noms de fichiers simples, basés sur le slug du produit
  const imageMap: Record<string, string> = {
    'Menu Garba "Clean"': '/images/garba.jpg',
    'Menu Smash Burger': '/images/burger.jpg',
    'Menu Mini-Chawarma': '/images/chawarma.jpg',
    'Menu Duo Mini-Pizzas': '/images/pizza.jpg',
    'Bissap Maison': '/images/bissap.jpg',
    'Fanta': '/images/fanta.jpg',
    'Coca-Cola (33cl)': '/images/coca.jpg',
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

  console.log('✅ Base de données mise à jour avec les chemins locaux !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
