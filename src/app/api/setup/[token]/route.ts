import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import crypto from 'crypto';

// ── Demo mock data ──
const DEMO_TOKEN = 'demo-setup';

const isDemo = (token: string) => token === DEMO_TOKEN;

// GET: Validate setup token — return plaque info without claiming
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 4) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 });
    }

    // ── DEMO MODE: return mock plaque data ──
    if (isDemo(token)) {
      return NextResponse.json({
        status: 'available',
        plaque: {
          id: 'demo-plaque-001',
          activationCode: DEMO_TOKEN,
          batchId: 'demo-batch-001',
          quantity: 10,
          designConfig: null,
        },
      });
    }

    // Try setupToken first, then fallback to activationCode for backward compatibility
    let plaque = await db.physicalQrCode.findUnique({
      where: { setupToken: token },
      include: {
        batch: true,
        claimedBy: { select: { id: true, fullName: true, email: true } },
        home: { select: { id: true, name: true, address: true } },
      },
    });

    if (!plaque) {
      plaque = await db.physicalQrCode.findUnique({
        where: { activationCode: token },
        include: {
          batch: true,
          claimedBy: { select: { id: true, fullName: true, email: true } },
          home: { select: { id: true, name: true, address: true } },
        },
      });
    }

    if (!plaque) {
      return NextResponse.json({ error: 'Plaque non trouvée' }, { status: 404 });
    }

    // Already claimed
    if (plaque.isClaimed && plaque.homeId) {
      return NextResponse.json({
        status: 'claimed',
        message: 'Cette plaque est déjà configurée',
        hubSlug: plaque.hubSlug || undefined,
        claimedBy: plaque.claimedBy
          ? { fullName: plaque.claimedBy.fullName, email: plaque.claimedBy.email }
          : undefined,
        homeName: plaque.home?.name || undefined,
      });
    }

    // Available for setup
    return NextResponse.json({
      status: 'available',
      plaque: {
        id: plaque.id,
        activationCode: plaque.activationCode,
        batchId: plaque.batch.id,
        quantity: plaque.batch.quantity,
        designConfig: plaque.designConfig,
      },
    });
  } catch (error) {
    console.error('Setup token check error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Execute setup — create user (if new), claim plaque, create home, set PIN, generate hubSlug
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      pin,
      homeName,
      plan,
      existingUserId,
      wifiSsid,
      wifiPassword,
      emergencyPhone,
    } = body;

    // ── DEMO MODE: simulate successful setup ──
    if (isDemo(token)) {
      return NextResponse.json({
        success: true,
        isNewUser: true,
        userId: 'demo-user-001',
        homeId: 'demo-home-001',
        homeName: homeName || 'Mon Appartement Demo',
        hubSlug: 'demo-hub',
        plan: plan || 'famille',
      });
    }

    // Validate inputs
    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }
    if (!existingUserId && (!password || password.length < 6)) {
      return NextResponse.json({ error: 'Mot de passe requis (6 caractères minimum)' }, { status: 400 });
    }
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'Code PIN à 4 chiffres requis' }, { status: 400 });
    }
    if (!homeName?.trim()) {
      return NextResponse.json({ error: 'Nom du logement requis' }, { status: 400 });
    }
    if (!plan || !['famille', 'airbnb_solo', 'airbnb_pro', 'free'].includes(plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Try setupToken first, then fallback to activationCode for backward compatibility
    let plaque = await db.physicalQrCode.findUnique({
      where: { setupToken: token },
      include: { batch: true },
    });

    if (!plaque) {
      plaque = await db.physicalQrCode.findUnique({
        where: { activationCode: token },
        include: { batch: true },
      });
    }

    if (!plaque) {
      return NextResponse.json({ error: 'Plaque non trouvée' }, { status: 404 });
    }

    if (plaque.isClaimed) {
      return NextResponse.json({ error: 'Cette plaque est déjà configurée' }, { status: 409 });
    }

    // Find or create user
    let userId = existingUserId || null;
    let isNewUser = false;

    if (userId) {
      // Verify the user exists
      const existingUser = await db.user.findUnique({ where: { id: userId } });
      if (!existingUser) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 400 });
      }
      // Update existing user with plan
      await db.user.update({
        where: { id: userId },
        data: { selectedPlan: plan, onboardingCompleted: true },
      });
    } else {
      // Check if email already taken
      const existingUser = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé. Connectez-vous d\'abord.' },
          { status: 409 }
        );
      }

      // Create new user
      const passwordHash = await hash(password, 12);
      const newUser = await db.user.create({
        data: {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          passwordHash,
          role: 'user',
          selectedPlan: plan,
          onboardingCompleted: true,
        },
      });
      userId = newUser.id;
      isNewUser = true;
    }

    // Hash the PIN
    const pinHash = await hash(pin, 10);

    // Generate hubSlug
    const baseSlug = homeName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = crypto.randomBytes(3).toString('hex');
    let hubSlug = `${baseSlug}-${suffix}`;
    // Ensure uniqueness
    let slugExists = await db.physicalQrCode.findUnique({ where: { hubSlug } });
    let attempts = 0;
    while (slugExists && attempts < 5) {
      const newSuffix = crypto.randomBytes(3).toString('hex');
      hubSlug = `${baseSlug}-${newSuffix}`;
      slugExists = await db.physicalQrCode.findUnique({ where: { hubSlug } });
      attempts++;
    }
    if (slugExists) {
      hubSlug = `home-${plaque.id.slice(0, 8)}`;
    }

    // Create home with PIN
    const home = await db.home.create({
      data: {
        name: homeName.trim(),
        ownerId: userId!,
        pinHash,
        address: '',
      },
    });

    // Create default room
    const defaultRoom = await db.room.create({
      data: { homeId: home.id, name: 'Salon', icon: 'salon' },
    });

    // Create WiFi QR code if credentials provided (visible to guests)
    if (wifiSsid?.trim()) {
      const wifiSlug = crypto.randomBytes(4).toString('hex');
      const wifiQr = await db.qrCode.create({
        data: {
          homeId: home.id,
          roomId: defaultRoom.id,
          name: 'WiFi',
          type: 'wifi',
          publicSlug: wifiSlug,
          isActive: true,
          isPrivate: false,
        },
      });
      await db.qrContent.create({
        data: {
          qrCodeId: wifiQr.id,
          contentJson: JSON.stringify({
            ssid: wifiSsid.trim(),
            password: wifiPassword?.trim() || '',
            security: 'WPA2',
          }),
        },
      });
    }

    // Create emergency contact QR code if phone provided
    if (emergencyPhone?.trim()) {
      const contactSlug = crypto.randomBytes(4).toString('hex');
      const contactQr = await db.qrCode.create({
        data: {
          homeId: home.id,
          roomId: defaultRoom.id,
          name: 'Contact',
          type: 'contact',
          publicSlug: contactSlug,
          isActive: true,
          isPrivate: false,
        },
      });
      await db.qrContent.create({
        data: {
          qrCodeId: contactQr.id,
          contentJson: JSON.stringify({
            name: fullName.trim(),
            phone: emergencyPhone.trim(),
          }),
        },
      });
    }

    // Ensure setupToken is set on the plaque (for old plaques that don't have one)
    const setupToken = plaque.setupToken || `SETUP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Claim the plaque (link to home)
    await db.physicalQrCode.update({
      where: { id: plaque.id },
      data: {
        isClaimed: true,
        claimedByUserId: userId!,
        claimedAt: new Date(),
        homeId: home.id,
        hubSlug,
        status: 'active',
        setupToken,
      },
    });

    // Create subscription record (non-blocking — table might not exist yet in prod)
    try {
      const planConfig: Record<string, { amount: number; cycle: string; maxHomes: number }> = {
        famille:     { amount: 49,   cycle: 'annual',  maxHomes: 1 },
        airbnb_solo: { amount: 9.9,  cycle: 'monthly', maxHomes: 1 },
        airbnb_pro:  { amount: 199,  cycle: 'annual',  maxHomes: 3 },
        free:        { amount: 0,    cycle: 'annual',  maxHomes: 1 },
      };

      const pc = planConfig[plan] || planConfig.free;
      await db.subscription.create({
        data: {
          subscriberId: userId!,
          subscriberType: 'user',
          plan,
          amount: pc.amount,
          billingCycle: pc.cycle,
          maxHomes: pc.maxHomes,
          status: 'trialing',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        },
      });
    } catch (subErr) {
      console.warn('[setup] Subscription creation skipped:', subErr instanceof Error ? subErr.message : subErr);
    }

    // Create the owner as a home member with 'owner' role
    await db.homeMember.create({
      data: {
        homeId: home.id,
        userId: userId!,
        role: 'owner',
        nickname: fullName.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      isNewUser,
      userId,
      homeId: home.id,
      homeName: home.name,
      hubSlug,
      plan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[setup] POST error:', message, error);
    return NextResponse.json({ error: `Erreur serveur: ${message}` }, { status: 500 });
  }
}
