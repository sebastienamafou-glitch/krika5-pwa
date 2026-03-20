// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Début du peuplement de la base de données...');

  const products = [
    {
      id: '1',
      name: 'Menu Garba "Clean"',
      description: 'Attiéké frais, Thon frit calibré (80g), Piment frais & Oignons. Hygiène garantie.',
      price: 1500,
    },
    {
      id: '2',
      name: 'Menu Smash Burger',
      description: 'Pain Brioché, Bœuf Smashé (60g), Cheddar fondant, Oignons grillés, Sauce Krika.',
      price: 1500,
    },
    {
      id: '3',
      name: 'Menu Mini-Chawarma',
      description: 'Pain Pita, Poulet Mariné grillé, Crudités croquantes, Crème d\'ail onctueuse.',
      price: 1500,
    },
    {
      id: '4',
      name: 'Menu Duo Mini-Pizzas',
      description: 'Deux mini-pizzas : 1 Reine (Jambon/Fromage) + 1 Trois Fromages. Croustillantes.',
      price: 1500,
    },
    {
      id: '5',
      name: 'Menu Wrap Tenders Crispy',
      description: 'Pain Pita, 2 Tenders de poulet ultra-croustillants, Crudités, Sauce au choix.',
      price: 1500,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {}, // Si le produit existe, on ne modifie rien
      create: product, // S'il n'existe pas, on le crée
    });
  }

  console.log("✅ Base de données synchronisée avec succès avec les 5 menus KRIKA'5 !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
