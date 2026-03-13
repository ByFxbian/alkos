import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if(!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isAdminOrHead = ['ADMIN', 'HEADOFBARBER'].includes(session.user.role);
    if (!isAdminOrHead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    if (session.user.role === 'HEADOFBARBER') {
        const requester = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { userLocations: { select: { locationId: true } } },
        });
        const requesterLocationIds = requester?.userLocations.map((ul) => ul.locationId) || [];

        const target = await prisma.user.findUnique({
            where: { id },
            include: { userLocations: { select: { locationId: true } } },
        });
        if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (target.role === 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const targetLocationIds = target.userLocations.map((ul) => ul.locationId);
        const hasOverlap = targetLocationIds.some((locId) => requesterLocationIds.includes(locId));
        if (!hasOverlap) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || !user.email) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.$transaction([
        prisma.blockedEmail.create({
            data: { email: user.email, reason: "Admin Ban" }
        }),
        prisma.user.delete({
            where: { id }
        })
    ]);

    return NextResponse.json({ success: true });
}
