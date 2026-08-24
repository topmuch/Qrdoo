import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      data: { homeId: home.id, userId: user.id, role: 'owner' },
    });
  }

  return user;
}

// POST: Handle doorbell actions (ring, message)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCodeId, action, text } = body as {
      qrCodeId: string;
      action: 'ring' | 'message';
      text?: string;
    };

    if (!qrCodeId || !action) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Verify QR code exists
    const qrCode = await db.qrCode.findUnique({
      where: { id: qrCodeId },
      include: { home: true },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code introuvable' },
        { status: 404 }
      );
    }

    const demoUser = await ensureDemoUser();

    // Log the action
    const actionType = action === 'ring' ? 'doorbell_ring' : 'doorbell_message';
    const details: Record<string, unknown> = {
      action,
      qrCodeName: qrCode.name,
      qrCodeType: qrCode.type,
      timestamp: new Date().toISOString(),
    };
    if (text) details.message = text;

    await db.activityLog.create({
      data: {
        homeId: qrCode.homeId,
        qrCodeId: qrCode.id,
        userId: demoUser.id,
        actionType,
        detailsJson: JSON.stringify(details),
      },
    });

    // TODO: Send push notification to home owner
    // This would integrate with the PushSubscription model
    // when PWA is set up in Étape 6

    return NextResponse.json({
      success: true,
      message: action === 'ring' ? 'Sonnette envoyée' : 'Message envoyé',
    });
  } catch (error) {
    console.error('[doorbell POST] Error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
