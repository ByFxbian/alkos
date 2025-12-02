import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
    logger.info("API Route /api/user/create POST called");
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

        return NextResponse.json(newUser, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        logger.error('API Route /api/user/create - User creation error:', { error, providedEmail: (await req.clone().json()).email });
        console.error('User creation error: ', error);

        if(error.code === "P2002") {
            logger.warn("API Route /api/user/create: Conflict (P2002) - Email already exists (caught).", { providedEmail: (await req.clone().json()).email });
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'An error occurred while creating the user.' }, { status: 500 });
    }
}