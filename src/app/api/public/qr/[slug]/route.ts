import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const qrCode = await db.qrCode.findUnique({
    where: { publicSlug: slug, isActive: true },
    include: { content: true },
  });

  if (!qrCode || !qrCode.isActive) {
    return NextResponse.json(
      { error: 'QR code not found or inactive' },
      { status: 404 }
    );
  }

  let parsedContent;
  try {
    parsedContent = JSON.parse(qrCode.content?.contentJson ?? '{}');
  } catch {
    parsedContent = {};
  }

  return NextResponse.json({
    qrCode: {
      id: qrCode.id,
      name: qrCode.name,
      type: qrCode.type,
      publicSlug: qrCode.publicSlug,
      isActive: qrCode.isActive,
    },
    content: parsedContent,
  });
}
