// =============================================================
// ORDOMOTIK - Script de creation du compte admin au deploiement
// Execute automatiquement par le Dockerfile au premier demarrage
// =============================================================

const { hash } = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function createAdmin() {
  const prisma = new PrismaClient();

  try {
    await prisma.user.count();
  } catch (error) {
    console.log('[create-admin] Table users non trouvee, arret.');
    await prisma.$disconnect();
    return;
  }

  try {
    // --- Compte Super Admin ---
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@qrdomotik.roomscan.pro' },
    });

    if (!existingAdmin) {
      const adminPasswordHash = await hash('QrDomotik2024!', 12);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@qrdomotik.roomscan.pro',
          fullName: 'Administrateur ORDOMOTIK',
          passwordHash: adminPasswordHash,
          role: 'superadmin',
        },
      });

      await prisma.home.create({
        data: {
          name: 'ORDOMOTIK HQ',
          ownerId: admin.id,
          address: 'Siege Social',
        },
      });

      console.log('[create-admin] Compte Super Admin cree avec succes');
    } else {
      console.log('[create-admin] Compte Super Admin existe deja, bypass.');
    }

    // --- Compte Demo Client ---
    const existingDemo = await prisma.user.findUnique({
      where: { email: 'demo@qrdomotik.roomscan.pro' },
    });

    if (!existingDemo) {
      const demoPasswordHash = await hash('demo123', 12);
      const demo = await prisma.user.create({
        data: {
          email: 'demo@qrdomotik.roomscan.pro',
          fullName: 'Utilisateur Demo',
          passwordHash: demoPasswordHash,
          role: 'user',
        },
      });

      await prisma.home.create({
        data: {
          name: 'Ma Maison Demo',
          ownerId: demo.id,
          address: '',
        },
      });

      console.log('[create-admin] Compte Demo Client cree avec succes');
    } else {
      console.log('[create-admin] Compte Demo Client existe deja, bypass.');
    }

    console.log('[create-admin] Initialisation terminee.');
  } catch (error) {
    console.error('[create-admin] Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
