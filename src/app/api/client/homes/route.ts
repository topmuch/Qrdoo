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
      data: {
        homeId: home.id,
        userId: user.id,
        role: 'owner',
      },
    });
  }

  return user;
}

// GET: List homes for the demo user
export async function GET() {
  try {
    const user = await ensureDemoUser();

    // Get all home IDs the user belongs to
    const memberships = await db.homeMember.findMany({
      where: { userId: user.id },
      select: { homeId: true },
    });

    const homeIds = memberships.map((m) => m.homeId);

    if (homeIds.length === 0) {
      return NextResponse.json({ homes: [] });
    }

    const homes = await db.home.findMany({
      where: { id: { in: homeIds } },
      include: {
        _count: {
          select: {
            rooms: true,
            members: true,
            qrCodes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ homes });
  } catch (error) {
    console.error('[homes GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST: Create a new home
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, userId } = body as {
      name: string;
      address?: string;
      userId?: string;
    };

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom de la maison est requis' },
        { status: 400 }
      );
    }

    // Resolve user
    let user;
    if (userId) {
      user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
      }
    } else {
      user = await ensureDemoUser();
    }

    const home = await db.home.create({
      data: {
        ownerId: user.id,
        name,
        address: address ?? null,
        isActive: true,
      },
    });

    // Auto-add user as owner
    await db.homeMember.create({
      data: {
        homeId: home.id,
        userId: user.id,
        role: 'owner',
      },
    });

    return NextResponse.json(home);
  } catch (error) {
    console.error('[homes POST] Error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
