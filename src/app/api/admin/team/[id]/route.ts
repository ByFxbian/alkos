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
  await prisma.teamMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}