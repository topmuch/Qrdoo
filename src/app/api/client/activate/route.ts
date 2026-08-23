import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

async function ensureDemoUser() {
  let user = await db.user.findFirst({
    where: { email: 'demo@qrdomotik.com' },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: 'demo@qrdomotik.com',
        fullName: 'Utilisateur Démo',
        role: 'user',
      },
    });

    const home = await db.home.create({
      data: {
        ownerId: user.id,
        name: 'Ma Maison',
        address: 'Dakar, Sénégal',
        isActive: true,
      },
    });

    await db.homeMember.create({
      data: {
        homeId: home.id,
        userId: user.id,
        role: 'owner',
      },
    });
  }

  // Find the user's first home membership
  const member = await db.homeMember.findFirst({
    where: { userId: user.id },
    include: { home: true },
  });

  return { user, home: member?.home };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, moduleType, roomId, name, homeId, userId } = body as {
      code: string;
      moduleType: string;
      roomId: string;
      name: string;
      homeId: string;
      userId?: string;
    };

    if (!code || !moduleType || !roomId || !name || !homeId) {
      return NextResponse.json(
        { error: 'Champs requis: code, moduleType, roomId, name, homeId' },
        { status: 400 }
      );
    }

    // Resolve user — use provided userId or fall back to demo
    let user;
    if (userId) {
      user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
      }
    } else {
      const demo = await ensureDemoUser();
      user = demo.user;
    }

    const publicSlug = crypto.randomUUID().slice(0, 8);

    const result = await db.$transaction(async (tx) => {
      // 1. Find physical QR code and verify it's inactive
      const physicalQr = await tx.physicalQrCode.findUnique({
        where: { activationCode: code },
      });

      if (!physicalQr) {
        throw new Error('Code QR physique introuvable');
      }

      if (physicalQr.status !== 'inactive') {
        throw new Error(`Ce code QR est déjà ${physicalQr.status}`);
      }

      // 2. Create QrCode record
      const qrCode = await tx.qrCode.create({
        data: {
          homeId,
          roomId,
          name,
          type: moduleType,
          publicSlug,
          isActive: true,
        },
      });

      // 3. Create QrContent with empty JSON
      await tx.qrContent.create({
        data: {
          qrCodeId: qrCode.id,
          contentJson: '{}',
        },
      });

      // 4. Update PhysicalQrCode
      const updatedPhysicalQr = await tx.physicalQrCode.update({
        where: { id: physicalQr.id },
        data: {
          status: 'active',
          activatedByUserId: user.id,
          activatedAt: new Date(),
          dynamicQrCodeId: qrCode.id,
        },
      });

      // 5. Create ActivationLog
      await tx.activationLog.create({
        data: {
          physicalQrCodeId: physicalQr.id,
          userId: user.id,
          action: 'activated',
        },
      });

      // 6. Create ActivityLog for the home
      await tx.activityLog.create({
        data: {
          homeId,
          qrCodeId: qrCode.id,
          userId: user.id,
          actionType: 'qr_activated',
          detailsJson: JSON.stringify({
            qrCodeName: name,
            moduleType,
            activationCode: code,
          }),
        },
      });

      return { qrCode, physicalQr: updatedPhysicalQr };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[activate] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
