import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER', 'BARBER'].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let whereClause = {};

  if (session.user.role !== 'ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { locations: { select: { id: true } } }
    });

    const assignedIds = user?.locations.map(l => l.id) || [];

    if (assignedIds.length === 0) {
      return NextResponse.json([]);
    }

    whereClause = {
      id: { in: assignedIds }
    };
  }

  const locations = await prisma.location.findMany({
    where: whereClause,
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(locations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, address, city, postalCode, phone, email, description, heroImage } = body;

  try {
    const location = await prisma.location.create({
      data: {
        name,
        slug,
        address,
        city,
        postalCode,
        phone,
        email,
        description,
        heroImage
      }
    });
    return NextResponse.json(location);
  } catch (e) {
    return NextResponse.json({ error: "Fehler beim Erstellen (Slug existiert evtl. schon)" }, { status: 500 });
  }
}