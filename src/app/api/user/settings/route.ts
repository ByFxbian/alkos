/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { logger } from '@/lib/logger';

export async function PATCH(req: Request) {
  console.log("API Route /api/user/settings PATCH called");
  logger.info("API Route /api/user/settings PATCH called");
  const session = await getServerSession(authOptions);
  let response: NextResponse;

  if (!session || !session.user) {
    logger.warn("API Route /api/user/settings PATCH: Unauthorized.");
    console.warn("API Route /api/user/settings PATCH: Unauthorized.");
    response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    return response;
  }
  logger.info("API Route /api/user/settings PATCH: User authorized.", { userId: session.user.id });
  console.log("API Route /api/user/settings PATCH: User authorized.", { userId: session.user.id });

  try {
    const body = await req.json();
    console.log("API Route /api/user/settings PATCH: Request body:", { userId: session.user.id, name: body.name, instagram: body.instagram, hasPassword: !!body.password });
    const { name, instagram, password, image, bio } = body;
    logger.info("API Route /api/user/settings PATCH: Request body received.", {
      userId: session.user.id,
      nameProvided: !!name,
      instagramProvided: !!instagram,
      imageProvided: !!image,
      bioProvided: !!bio,
      hasPassword: !!password
    });
    const updateData: { 
        name?: string; 
        instagram?: string; 
        image?: string;
        bio?: string;
        password?: string 
    } = {};

    if (name !== undefined) updateData.name = name;
    if (instagram !== undefined) updateData.instagram = instagram;
    if (image !== undefined) updateData.image = image;
    if (bio !== undefined) updateData.bio = bio;

    if (password) {
      logger.info("API Route /api/user/settings PATCH: Password change requested.", { userId: session.user.id });
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    logger.info("API Route /api/user/settings PATCH: User updated successfully.", { userId: updatedUser.id });
    console.log("API Route /api/user/settings PATCH: User updated successfully.", { userId: updatedUser.id });

    response = NextResponse.json(updatedUser);
  } catch (error: any) {
    logger.error('API Route /api/user/settings PATCH - Settings update error:', { userId: session?.user?.id, error });
    console.error('API Route /api/user/settings PATCH - Settings update error:', error);
    if (error.code === 'P2002') {
      logger.warn("API Route /api/user/settings PATCH: Conflict - Instagram username likely taken.", { userId: session?.user?.id, instagram: (await req.clone().json()).instagram });
      response = NextResponse.json({ error: 'Dieser Instagram-Benutzername ist bereits vergeben.' }, { status: 409 });
    } else {
      response = NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen.' }, { status: 500 });
    }
  } finally {
      logger.info("API Route /api/user/settings PATCH: Flushing logs.");
      await logger.flush();
  }

  if (!response!) {
      logger.error("API Route /api/user/settings PATCH: Reached end without setting a response.");
      response = NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
      await logger.flush();
  }
  return response!;
}

export async function DELETE(req: Request) {
  logger.info("API Route /api/user/settings DELETE called");
  console.log("API Route /api/user/settings DELETE called");
  const session = await getServerSession(authOptions);
  let response: NextResponse;

  if (!session || !session.user) {
    logger.warn("API Route /api/user/settings DELETE: Unauthorized.");
    console.warn("API Route /api/user/settings DELETE: Unauthorized.");
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  logger.info("API Route /api/user/settings DELETE: User authorized.", { userId: session.user.id });
  console.log("API Route /api/user/settings DELETE: User authorized.", { userId: session.user.id });

  try {
    const { password } = await req.json();
    logger.info("API Route /api/user/settings DELETE: Attempting deletion.", { userId: session.user.id });
    console.log("API Route /api/user/settings DELETE: Attempting deletion for user:", session.user.id);

    if (!password) {
      logger.warn("API Route /api/user/settings DELETE: Password required but not provided.", { userId: session.user.id });
      response = NextResponse.json({ error: 'Passwort erforderlich' }, { status: 400 });
      return response;
    }
    
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!user || !user.password) {
      logger.error("API Route /api/user/settings DELETE: Action not possible - User not found or has no password.", { userId: session.user.id, userFound: !!user, hasPassword: !!user?.password });
      response = NextResponse.json({ error: 'Aktion nicht möglich' }, { status: 403 });
      return response;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.warn("API Route /api/user/settings DELETE: Incorrect password provided.", { userId: session.user.id });
      response = NextResponse.json({ error: 'Falsches Passwort' }, { status: 403 });
      return response;
    }

    logger.info("API Route /api/user/settings DELETE: Password verified, proceeding with transaction.", { userId: session.user.id });
    console.log("API Route /api/user/settings DELETE: Password verified, proceeding with transaction for user:", session.user.id);
    await prisma.$transaction(async (tx) => {
      const userId = session.user.id;
      await tx.appointment.deleteMany({ where: { customerId: userId } });
      await tx.appointment.deleteMany({ where: { barberId: userId } });
      await tx.availability.deleteMany({ where: { barberId: userId } });

      await tx.account.deleteMany({ where: { userId: userId }});
      await tx.session.deleteMany({ where: { userId: userId }});
      
      await tx.user.delete({ where: { id: userId } });
    });
    logger.info("API Route /api/user/settings DELETE: Account deleted successfully.", { userId: session.user.id });
    console.log("API Route /api/user/settings DELETE: Account deleted successfully for user:", session.user.id);

    response = NextResponse.json({ message: 'Konto erfolgreich gelöscht' });
  } catch (error) {
    logger.error('API Route /api/user/settings DELETE - Account deletion error:', { userId: session?.user?.id, error });
    console.error('API Route /api/user/settings DELETE - Account deletion error:', { userId: session?.user?.id, error }); 
    if (error instanceof NextResponse) {
      response = error;
    } else {
      response = NextResponse.json({ error: 'Fehler beim Löschen des Kontos.' }, { status: 500 });
    }
    
  } finally {
       logger.info("API Route /api/user/settings DELETE: Flushing logs.");
      await logger.flush();
  }
  if (!response!) {
      logger.error("API Route /api/user/settings DELETE: Reached end without setting a response.");
      response = NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
      await logger.flush();
  }
  return response!;
}