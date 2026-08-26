import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';

// GET: Public hub info — home, rooms, active non-private QR codes
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || slug.length < 2) {
      return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
    }

    // Find the plaque by hubSlug
    const plaque = await db.physicalQrCode.findUnique({
      where: { hubSlug: slug },
      include: {
        claimedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!plaque || !plaque.isClaimed || !plaque.homeId) {
      return NextResponse.json({ error: 'Hub non trouvé' }, { status: 404 });
    }

    // Fetch the home
    const home = await db.home.findUnique({
      where: { id: plaque.homeId },
      select: {
        id: true,
        name: true,
        address: true,
        pinHash: true,
      },
    });

    if (!home) {
      return NextResponse.json({ error: 'Logement non trouvé' }, { status: 404 });
    }

    // Fetch rooms with their active non-private QR codes (guest mode)
    const guestRooms = await db.room.findMany({
      where: { homeId: home.id },
      orderBy: { createdAt: 'asc' },
      include: {
        qrCodes: {
          where: { isActive: true, isPrivate: false },
          orderBy: { createdAt: 'asc' },
          include: {
            content: { select: { contentJson: true } },
          },
        },
      },
    });

    // Fetch ALL active QR codes (including private) for family mode
    const familyRooms = await db.room.findMany({
      where: { homeId: home.id },
      orderBy: { createdAt: 'asc' },
      include: {
        qrCodes: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: {
            content: { select: { contentJson: true } },
          },
        },
      },
    });

    // Fetch recent voice messages (last 10)
    const voiceMessages = await db.voiceMessage.findMany({
      where: { homeId: home.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        senderName: true,
        senderType: true,
        audioUrl: true,
        durationSec: true,
        createdAt: true,
      },
    });

    // Build room data helper
    const buildRoomData = (roomList: typeof guestRooms) =>
      roomList.map((room) => ({
        id: room.id,
        name: room.name,
        icon: room.icon,
        qrCodes: room.qrCodes.map((qr) => ({
          id: qr.id,
          name: qr.name,
          type: qr.type,
          publicSlug: qr.publicSlug,
          isPrivate: qr.isPrivate,
          content: qr.content?.contentJson
            ? (() => { try { return JSON.parse(qr.content.contentJson); } catch { return {}; } })()
            : {},
        })),
      }));

    return NextResponse.json({
      home: {
        id: home.id,
        name: home.name,
        address: home.address,
        hasPin: !!home.pinHash,
      },
      ownerName: plaque.claimedBy?.fullName || null,
      guestRooms: buildRoomData(guestRooms),
      familyRooms: buildRoomData(familyRooms),
      voiceMessages,
    });
  } catch (error) {
    console.error('Hub GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Verify PIN for family mode
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { pin } = body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN invalide' }, { status: 400 });
    }

    // Find the plaque and home
    const plaque = await db.physicalQrCode.findUnique({
      where: { hubSlug: slug },
    });

    if (!plaque || !plaque.isClaimed || !plaque.homeId) {
      return NextResponse.json({ error: 'Hub non trouvé' }, { status: 404 });
    }

    const home = await db.home.findUnique({
      where: { id: plaque.homeId },
      select: { id: true, pinHash: true },
    });

    if (!home || !home.pinHash) {
      return NextResponse.json({ error: 'Aucun PIN configuré' }, { status: 400 });
    }

    const isValid = await compare(pin, home.pinHash);
    if (!isValid) {
      return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 });
    }

    return NextResponse.json({ success: true, homeId: home.id });
  } catch (error) {
    console.error('Hub PIN verify error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
