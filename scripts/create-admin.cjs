// =============================================================
// ORDOMOTIK - Script de creation/mise a jour des comptes admin
// Execute automatiquement par le Dockerfile a chaque demarrage
// Force la mise a jour des hashes bcryptjs a chaque deploy
// =============================================================

const { hash } = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function seedUsers() {
  const prisma = new PrismaClient();

  try {
    await prisma.user.count();
  } catch (error) {
    console.log('[seed-users] Table users non trouvee, arret.');
    await prisma.$disconnect();
    return;
  }

  try {
    // --- Compte Super Admin ---
    const adminHash = await hash('QrDomotik2024!', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@qrdomotik.roomscan.pro' },
      update: { passwordHash: adminHash, fullName: 'Administrateur ORDOMOTIK', role: 'superadmin' },
      create: {
        email: 'admin@qrdomotik.roomscan.pro',
        fullName: 'Administrateur ORDOMOTIK',
        passwordHash: adminHash,
        role: 'superadmin',
      },
    });
    console.log('[seed-users] Super Admin OK:', admin.email);

    // Creer le home s'il n'existe pas
    const adminHomeCount = await prisma.home.count({ where: { ownerId: admin.id } });
    if (adminHomeCount === 0) {
      await prisma.home.create({
        data: { name: 'ORDOMOTIK HQ', ownerId: admin.id, address: 'Siege Social' },
      });
      console.log('[seed-users] Home ORDOMOTIK HQ cree');
    }

    // --- Compte Demo Client ---
    const demoHash = await hash('demo123', 12);
    const demo = await prisma.user.upsert({
      where: { email: 'demo@qrdomotik.roomscan.pro' },
      update: { passwordHash: demoHash, fullName: 'Utilisateur Demo', role: 'user' },
      create: {
        email: 'demo@qrdomotik.roomscan.pro',
        fullName: 'Utilisateur Demo',
        passwordHash: demoHash,
        role: 'user',
      },
    });
    console.log('[seed-users] Demo Client OK:', demo.email);

    // Creer le home demo s'il n'existe pas
    const demoHomeCount = await prisma.home.count({ where: { ownerId: demo.id } });
    if (demoHomeCount === 0) {
      await prisma.home.create({
        data: { name: 'Ma Maison Demo', ownerId: demo.id, address: '' },
      });
      console.log('[seed-users] Home Ma Maison Demo cree');
    }

    console.log('[seed-users] Initialisation terminee avec succes.');
  } catch (error) {
    console.error('[seed-users] Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
