import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    const locations = await prisma.location.findMany({
        select: { id: true, name: true, slug: true, city: true, address: true, heroImage: true }
    });
    return NextResponse.json({ locations });
  }

  const location = await prisma.location.findUnique({
    where: { slug },
    include: {
        teamMembers: {
            orderBy: { sortOrder: 'asc' }
        },
        services: {
            orderBy: { price: 'asc' }
        }
    }
  });

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  return NextResponse.json({ location });
}