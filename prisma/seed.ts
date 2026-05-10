// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Sécurisation et peuplement de la base...');

  const hashedPassword = await bcrypt.hash('krika5', 12);

  // 1. Création de l'Administrateur avec mot de passe haché
  await prisma.user.upsert({
    where: { phone: 'admin' },
    update: { password: hashedPassword },
    create: {
      phone: 'admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // 2. Création des Catégories
  const catMenu = await prisma.category.upsert({
    where: { slug: 'menus' },
    update: { name: 'Menus KRIKA\'5', order: 1 },
    create: { name: 'Menus KRIKA\'5', slug: 'menus', order: 1 },
  });

  const catBoisson = await prisma.category.upsert({
    where: { slug: 'boissons' },
    update: { name: 'Boissons Fraîches', order: 2 },
    create: { name: 'Boissons Fraîches', slug: 'boissons', order: 2 },
  });

  // 3. Création des Produits avec des CUID valides
  const products = [
    // --- MENUS ---
    {
      id: 'cm0yw07r200007q1hg5d12345',
      name: 'Menu Garba "Clean"',
      description: 'Attiéké frais, Thon frit calibré (80g), Piment frais & Oignons. Hygiène garantie.',
      price: 1500,
      categoryId: catMenu.id,
      stock: 50,
    },
    {
      id: 'cm0yw07r200017q1hg5d12346',
      name: 'Menu Smash Burger',
      description: 'Pain Brioché, Bœuf Smashé (60g), Cheddar fondant, Oignons grillés, Sauce Krika.',
      price: 1500,
      categoryId: catMenu.id,
      stock: 30,
    },
    {
      id: 'cm0yw07r200027q1hg5d12347',
      name: 'Menu Mini-Chawarma',
      description: 'Pain Pita, Poulet Mariné grillé, Crudités croquantes, Crème d\'ail onctueuse.',
      price: 1500,
      categoryId: catMenu.id,
      stock: 40,
    },
    {
      id: 'cm0yw07r200037q1hg5d12348',
      name: 'Menu Duo Mini-Pizzas',
      description: 'Deux mini-pizzas : 1 Reine (Jambon/Fromage) + 1 Trois Fromages. Croustillantes.',
      price: 1500,
      categoryId: catMenu.id,
      stock: 20,
    },
    // --- BOISSONS ---
    {
      id: 'cm0yw07r200047q1hg5d12349',
      name: 'Bissap Maison',
      description: 'Jus de fleurs d\'hibiscus, menthe fraîche et sucre de canne. Fait maison.',
      price: 500,
      categoryId: catBoisson.id,
      stock: 100,
    },
    {
      id: 'cm0yw07r200057q1hg5d12350',
      name: 'fantai',
      description: 'Jus de gingembre épicé et citron. Fait maison.',
      price: 500,
      categoryId: catBoisson.id,
      stock: 100,
    },
    {
      id: 'cm0yw07r200067q1hg5d12351',
      name: 'Coca-Cola (33cl)',
      description: 'Canette bien glacée.',
      price: 1000,
      categoryId: catBoisson.id,
      stock: 24,
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        stock: product.stock,
      },
      create: product,
    });
  }

  console.log('✅ Base de données V2 synchronisée (Admin, Catégories, Produits et Stocks) !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
