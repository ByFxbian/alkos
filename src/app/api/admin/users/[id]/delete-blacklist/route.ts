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