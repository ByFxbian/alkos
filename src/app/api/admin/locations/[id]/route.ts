import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (session.user.role === 'HEADOFBARBER') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { locations: { select: { id: true } } }
    });

    const isAssigned = user?.locations.some(l => l.id === id);
    if (!isAssigned) {
      return NextResponse.json({ error: "Forbidden: Not your location" }, { status: 403 });
    }
  }

  const body = await req.json();

  if (session.user.role !== 'ADMIN') {
    delete body.slug;
  }

  try {
    const location = await prisma.location.update({
      where: { id },
      data: { ...body }
    });
    return NextResponse.json(location);
  } catch (e) {
    return NextResponse.json({ error: "Update Failed", details: e }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Kann Location nicht löschen (noch verknüpfte Daten?)" }, { status: 500 });
  }
}