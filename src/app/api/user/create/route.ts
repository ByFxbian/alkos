import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
    logger.info("API Route /api/user/create POST called");
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`user-create:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!rl.ok) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte später erneut versuchen." }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { email, name } = body;
        logger.info("API Route /api/user/create: Attempting user creation.", { email, nameProvided: !!name });

        if(!email) {
            logger.warn("API Route /api/user/create: Email is required but missing.");
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email }});
        if (existingUser) {
             logger.warn("API Route /api/user/create: Conflict - Email already exists.", { email });
             return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
            },
        });
        logger.info("API Route /api/user/create: User created successfully.", { userId: newUser.id, email: newUser.email });

        return NextResponse.json(
            {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                createdAt: newUser.createdAt,
            },
            { status: 201 }
        );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        logger.error('API Route /api/user/create - User creation error:', { error });
        console.error('User creation error: ', error);

        if(error.code === "P2002") {
            logger.warn("API Route /api/user/create: Conflict (P2002) - Email already exists (caught).");
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'An error occurred while creating the user.' }, { status: 500 });
    }
}
