import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Ungültiger Dateityp' }, { status: 400 });
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Datei ist zu groß (max. 5MB)' }, { status: 413 });
  }

  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const uniquePath = `avatars/${session.user.id}/${Date.now()}-${sanitizedFilename || 'avatar'}`;

  const blob = await put(uniquePath, request.body, {
    access: 'public',
    allowOverwrite: false,
    contentType,
  });


  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: blob.url },
  });

  return NextResponse.json(blob);
}
