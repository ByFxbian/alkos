import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name } = body;

        if(!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('User creation error: ', error);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if(error instanceof Error && 'code' in error && (error as any).code === "P2002") {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'An error occurred while creating the user.' }, { status: 500 });
    }
}