/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { logger } from '@/lib/logger';
import { PrismaClientKnownRequestError } from '@/generated/prisma/runtime/library';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  logger.info("API Route /api/auth/register POST called");
  let response: NextResponse;
  let requestEmail: string | undefined;

  const ip = getClientIp(req);
  const rl = checkRateLimit(`auth-register:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 });
  }

  try {
    const requestBody = await req.json();
    const { email, name, password, instagram } = requestBody as any;
    requestEmail = email;
    const isBlacklisted = await prisma.blockedEmail.findUnique({
      where: { email }
    });
    if(isBlacklisted) {
      return NextResponse.json({ error: 'Diese E-Mail-Adresse ist dauerhaft gesperrt.' }, { status: 403 });
    }
    logger.info("API Route /api/auth/register: Attempting registration", { email, name, instagramProvided: !!instagram });

    if (!email || !name || !password) {
      logger.warn("API Route /api/auth/register: Missing required fields.", { emailProvided: !!email, nameProvided: !!name, passwordProvided: !!password });
      response = NextResponse.json({ error: 'Fehlende Angaben' }, { status: 400 });
      return response;
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

    response = NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      emailVerified: newUser.emailVerified,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      let targetFields: string[] = [];
      if (error.meta && Array.isArray(error.meta.target)) {
        targetFields = error.meta.target as string[];
      }
      if (targetFields.includes('email')) {
        logger.warn("API Route /api/auth/register: Conflict - Email already exists.", { providedEmail: requestEmail });
        response = NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' }, { status: 409 });
      
      } else if (targetFields.includes('instagram')) {
        logger.warn("API Route /api/auth/register: Conflict - Instagram handle already taken.");
        response = NextResponse.json({ error: 'Dieser Instagram-Name ist bereits vergeben.' }, { status: 409 });
      
      } else {
        logger.warn("API Route /api/auth/register: Conflict - Unique constraint failed.", { errorMeta: error.meta });
        response = NextResponse.json({ error: 'Benutzer existiert bereits' }, { status: 409 });
      }

    } else {
      logger.error('API Route /api/auth/register - Registration error:', { error, requestEmail });
      if (error instanceof TypeError) {
        logger.error('API Route /api/auth/register - Encountered TypeError:', { message: error.message, stack: error.stack });
      }
      response = NextResponse.json({ error: 'Ein Fehler ist bei der Registrierung aufgetreten.' }, { status: 500 });
    }
  } finally {
    logger.info("API Route /api/auth/register POST: Flushing logs.");
    await logger.flush();
  }
  if (!response!) {
    logger.error("API Route /api/auth/register POST: Reached end without setting a response.");
    response = NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
    await logger.flush();
  }
  return response;
}
