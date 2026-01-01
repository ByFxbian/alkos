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
    const allowedIds = user?.locations.map(l => l.id) || [];

    if (allowedIds.length === 0) {
      // If no location assigned, show nothing? Or generic global if any?
      // Safest: Show nothing.
      return NextResponse.json([]);
    }

    // Show members that are associated with AT LEAST ONE of the user's allowed locations.
    whereClause = {
      locations: {
        some: { id: { in: allowedIds } }
      }
    };
  }

  const members = await prisma.teamMember.findMany({
    where: whereClause,
    orderBy: { sortOrder: 'asc' },
    include: { locations: true }
  });
  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, role, bio, image, sortOrder, locationIds } = body;

  // SECURITY: Validate Location Access
  if (session.user.role !== 'ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { locations: { select: { id: true } } }
    });
    const allowedIds = user?.locations.map(l => l.id) || [];

    // Check if ALL requested locationIds are allowed.
    const isValid = locationIds.every((id: string) => allowedIds.includes(id));
    if (!isValid) {
      return NextResponse.json({ error: "Forbidden: You cannot assign members to locations you do not manage." }, { status: 403 });
    }
  }

  const member = await prisma.teamMember.create({
    data: {
      name,
      role,
      bio,
      image,
      sortOrder: Number(sortOrder),
      locations: {
        connect: locationIds.map((id: string) => ({ id }))
      }
    }
  });
  return NextResponse.json(member);
}