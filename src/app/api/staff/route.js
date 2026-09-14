import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { staffSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

function serialize(account) {
    return { id: account.id, name: account.name, email: account.email, createdAt: account.createdAt };
}

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.account.findMany({
        where: { staffOfId: session.providerId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff.map(serialize));
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(staffSchema, await request.json());
    if (error) return error;
    const { name, email, password } = data;

    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const account = await prisma.account.create({
        data: { role: "PROVIDER", name, email, passwordHash, staffOfId: session.providerId },
    });

    return NextResponse.json(serialize(account));
}
