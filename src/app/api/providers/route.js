import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { providerSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providers = await prisma.provider.findMany({
        include: { account: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
    });

    const result = providers.map((p) => ({
        id: p.id,
        businessName: p.businessName,
        ownerName: p.ownerName,
        email: p.account.email,
        status: p.status,
    }));

    return NextResponse.json(result);
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(providerSchema, await request.json());
    if (error) return error;
    const { businessName, ownerName, email, password } = data;

    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const provider = await prisma.provider.create({
        data: {
            businessName,
            ownerName,
            account: {
                create: { email, passwordHash, role: "PROVIDER" },
            },
        },
        include: { account: { select: { email: true } } },
    });

    return NextResponse.json({
        id: provider.id,
        businessName: provider.businessName,
        ownerName: provider.ownerName,
        email: provider.account.email,
        status: provider.status,
    });
}