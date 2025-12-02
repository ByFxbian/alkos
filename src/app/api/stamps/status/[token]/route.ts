import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
) {
  const token = req.nextUrl.pathname.split('/').pop();

  if (!token) {
    return NextResponse.json({ error: 'Token fehlt' }, { status: 400 });
  }
  try {
    const stampToken = await prisma.stampToken.findUnique({
      where: { token },
      select: { redeemedAt: true },
    });

    if (!stampToken) {
      return NextResponse.json({ error: 'Token nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ isRedeemed: !!stampToken.redeemedAt });
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}