import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if(!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isAdminOrHead = ['ADMIN', 'HEADOFBARBER'].includes(session.user.role);
    if (!isAdminOrHead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { isBlocked } = await req.json();

    await prisma.user.update({
        where: { id },
        data: { isBlocked }
    });

    return NextResponse.json({ success: true });
}