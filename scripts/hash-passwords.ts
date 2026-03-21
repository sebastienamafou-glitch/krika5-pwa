// scripts/hash-passwords.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Démarrage de la migration des mots de passe...');
  
  // On cible uniquement le Staff et les Admins
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'STAFF'] },
    },
  });

  for (const user of users) {
    // Si le mot de passe existe et n'est pas déjà un hash bcrypt (qui commence par $2a$ ou $2b$)
    if (user.password && !user.password.startsWith('$2')) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      
      console.log(`✅ Mot de passe sécurisé pour l'utilisateur : ${user.phone}`);
    }
  }
  
  console.log('Migration terminée avec succès.');
}

main()
  .catch((e) => {
    console.error("Erreur lors de la migration :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
