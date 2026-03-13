import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, role, bio, image, sortOrder, locationIds } = body;

  if (session.user.role === 'HEADOFBARBER') {
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userLocations: { select: { locationId: true } } },
    });
    const allowedLocationIds = requester?.userLocations.map((ul) => ul.locationId) || [];

    const targetMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { locations: { select: { id: true } } },
    });
    if (!targetMember) return NextResponse.json({ error: 'Teammitglied nicht gefunden' }, { status: 404 });

    const hasOverlap = targetMember.locations.some((l) => allowedLocationIds.includes(l.id));
    if (!hasOverlap) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (Array.isArray(locationIds)) {
      const allAllowed = locationIds.every((lid: string) => allowedLocationIds.includes(lid));
      if (!allAllowed) {
        return NextResponse.json({ error: 'Sie können nur eigene Standorte zuweisen' }, { status: 403 });
      }
    }
  }

  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      name, role, bio, image, sortOrder: Number(sortOrder),
      locations: {
        set: locationIds.map((lid: string) => ({ id: lid }))
      }
    }
  });

  return NextResponse.json(member);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (session.user.role === 'HEADOFBARBER') {
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userLocations: { select: { locationId: true } } },
    });
    const allowedLocationIds = requester?.userLocations.map((ul) => ul.locationId) || [];

    const targetMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { locations: { select: { id: true } } },
    });
    if (!targetMember) return NextResponse.json({ error: 'Teammitglied nicht gefunden' }, { status: 404 });

    const hasOverlap = targetMember.locations.some((l) => allowedLocationIds.includes(l.id));
    if (!hasOverlap) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  await prisma.teamMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
