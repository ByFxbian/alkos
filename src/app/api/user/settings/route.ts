import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function PATCH(req: Request) {
  console.log("API Route /api/user/settings PATCH called");
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.warn("API Route /api/user/settings PATCH: Unauthorized.");
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  console.log("API Route /api/user/settings PATCH: User authorized.", { userId: session.user.id });

  try {
    const body = await req.json();
    console.log("API Route /api/user/settings PATCH: Request body:", { userId: session.user.id, name: body.name, instagram: body.instagram, hasPassword: !!body.password });
    const { name, instagram, password, image, bio } = body;
    const updateData: { 
        name: string; 
        instagram: string; 
        image: string;
        bio: string;
        password?: string 
    } = {
        name,
        instagram,
        image,
        bio,
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    console.log("API Route /api/user/settings PATCH: User updated successfully.", { userId: updatedUser.id });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('API Route /api/user/settings PATCH - Settings update error:', error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Dieser Instagram-Benutzername ist bereits vergeben.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  console.log("API Route /api/user/settings DELETE called");
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.warn("API Route /api/user/settings DELETE: Unauthorized.");
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  console.log("API Route /api/user/settings DELETE: User authorized.", { userId: session.user.id });

  try {
    const { password } = await req.json();
    console.log("API Route /api/user/settings DELETE: Attempting deletion for user:", session.user.id);

    if (!password) {
      return NextResponse.json({ error: 'Passwort erforderlich' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Aktion nicht möglich' }, { status: 403 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Falsches Passwort' }, { status: 403 });
    }

    console.log("API Route /api/user/settings DELETE: Password verified, proceeding with transaction for user:", session.user.id);
    await prisma.$transaction(async (tx) => {
      const userId = session.user.id;
      await tx.appointment.deleteMany({ where: { customerId: userId } });
      await tx.appointment.deleteMany({ where: { barberId: userId } });
      await tx.availability.deleteMany({ where: { barberId: userId } });
      
      await tx.user.delete({ where: { id: userId } });
    });

    console.log("API Route /api/user/settings DELETE: Account deleted successfully for user:", session.user.id);

    return NextResponse.json({ message: 'Konto erfolgreich gelöscht' });
  } catch (error) {
    console.error('API Route /api/user/settings DELETE - Account deletion error:', { userId: session?.user?.id, error }); 
    if (error instanceof NextResponse) return error;
    return NextResponse.json({ error: 'Fehler beim Löschen des Kontos.' }, { status: 500 });
  }
}