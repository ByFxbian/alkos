import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password, instagram } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Fehlende Angaben' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        instagram,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: 'Benutzer existiert bereits' }, { status: 409 });
  }
}