import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { customerSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

function serialize(customer) {
    return { ...customer, creditBalance: Number(customer.creditBalance) };
}

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
        where: { providerId: session.providerId, isActive: true },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers.map(serialize));
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(customerSchema, await request.json());
    if (error) return error;
    const { name, phone, creditBalance } = data;

    const customer = await prisma.customer.create({
        data: { providerId: session.providerId, name, phone, creditBalance: creditBalance || 0 },
    });

    return NextResponse.json(serialize(customer));
}