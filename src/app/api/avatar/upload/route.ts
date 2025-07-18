import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Keine Datei gefunden' }, { status: 400 });
  }

  // Lade die Datei zu Vercel Blob hoch
  const blob = await put(filename, request.body, {
    access: 'public',
  });

  // Speichere die neue URL in der Datenbank des Nutzers
  await prisma.user.update({
    where: { id: session.user.id },
    data: { imageUrl: blob.url },
  });

  return NextResponse.json(blob);
}