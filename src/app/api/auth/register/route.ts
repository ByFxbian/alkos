import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  logger.info("API Route /api/auth/register POST called");
  let response: NextResponse;
  try {
    const body = await req.json();
    const { email, name, password, instagram } = body;
    logger.info("API Route /api/auth/register: Attempting registration", { email, name, instagramProvided: !!instagram });

    if (!email || !name || !password) {
      logger.warn("API Route /api/auth/register: Missing required fields.", { emailProvided: !!email, nameProvided: !!name, passwordProvided: !!password });
      return NextResponse.json({ error: 'Fehlende Angaben' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        instagram,
        emailVerified: null,
      },
    });
    logger.info("API Route /api/auth/register: User created successfully.", { userId: newUser.id, email: newUser.email });

    response = NextResponse.json(newUser, { status: 201 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 'P2002') {
       logger.warn("API Route /api/auth/register: Conflict - User already exists.", { providedEmail: (await req.clone().json()).email }); // Logge die E-Mail
       response = NextResponse.json({ error: 'Benutzer existiert bereits' }, { status: 409 });
    } else {
      logger.error('API Route /api/auth/register - Registration error:', error); // Logging Fehler
      response = NextResponse.json({ error: 'Ein Fehler ist bei der Registrierung aufgetreten.' }, { status: 500 });
    }
  } finally {
    logger.info("API Route /api/auth/register POST: Flushing logs.");
    await logger.flush();
  }
  return response;
}