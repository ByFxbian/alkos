import { DefaultSession } from "next-auth";

declare module 'next-auth' {
    interface Session {
        user: {
            id: string,
            role: string;
            emailVerified: Date | null;
            instagram?: string | null;
        } & DefaultSession["user"];
    }
}