// =============================================================
// QR Domotik - Script de creation du compte admin au deploiement
// Execute automatiquement par le Dockerfile au premier demarrage
// =============================================================

const { PrismaClient } = require('@prisma/client');

async function hashPassword(password) {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `$pbkdf2-sha512$10000$${salt}$${hash}`;
}

// Fallback: utiliser bcryptjs si disponible
async function getHash(password) {
  try {
    const bcryptjs = require('bcryptjs');
    return await bcryptjs.hash(password, 12);
  } catch {
    return hashPassword(password);
  }
}

async function createAdmin() {
  const prisma = new PrismaClient();

  try {
    // Verifier si la table users existe
    await prisma.user.count();
  } catch (error) {
    console.log('[create-admin] Table users non trouvee, initialisation...');
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    } catch {
      console.log('[create-admin] Impossible de pousser le schema, arret.');
      await prisma.$disconnect();
      return;
    }
  }

  try {
    // --- Compte Super Admin ---
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@qrdomotik.com' },
    });

    if (!existingAdmin) {
      const adminPasswordHash = await getHash('QrDomotik2024!');
      const admin = await prisma.user.create({
        data: {
          email: 'admin@qrdomotik.com',
          fullName: 'Administrateur QR Domotik',
          passwordHash: adminPasswordHash,
          role: 'superadmin',
        },
      });

      await prisma.home.create({
        data: {
          name: 'QR Domotik HQ',
          ownerId: admin.id,
          address: 'Siege Social',
        },
      });

      console.log('[create-admin] Compte Super Admin cree avec succes');
      console.log('  Email: admin@qrdomotik.com');
      console.log('  Mot de passe: QrDomotik2024!');
    } else {
      console.log('[create-admin] Compte Super Admin existe deja, bypass.');
    }

    // --- Compte Demo Client ---
    const existingDemo = await prisma.user.findUnique({
      where: { email: 'demo@qrdomotik.com' },
    });

    if (!existingDemo) {
      const demoPasswordHash = await getHash('demo123');
      const demo = await prisma.user.create({
        data: {
          email: 'demo@qrdomotik.com',
          fullName: 'Utilisateur Demo',
          passwordHash: demoPasswordHash,
          role: 'user',
        },
      });

      await prisma.home.create({
        data: {
          name: 'Ma Maison',
          ownerId: demo.id,
          address: '',
        },
      });

      console.log('[create-admin] Compte Demo Client cree avec succes');
      console.log('  Email: demo@qrdomotik.com');
      console.log('  Mot de passe: demo123');
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
