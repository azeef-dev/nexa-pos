import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
    const passwordHash = await hashPassword("admin123");

    const account = await prisma.account.upsert({
        where: { email: "admin@nexapos.com" },
        update: {},
        create: {
            email: "admin@nexapos.com",
            passwordHash,
            role: "SUPER_ADMIN",
        },
    });

    return NextResponse.json({ message: "Seeded Super Admin", email: account.email });
}