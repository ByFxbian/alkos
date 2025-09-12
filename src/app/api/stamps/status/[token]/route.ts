import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: unknown }
) {
  const { params } = context as { params: { token: string } };
  try {
    const { token } = params;
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