import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function serialize(customer) {
    return { ...customer, creditBalance: Number(customer.creditBalance) };
}

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
        where: { providerId: session.providerId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers.map(serialize));
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, creditBalance } = await request.json();

    if (!name || !phone) {
        return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
        data: { providerId: session.providerId, name, phone, creditBalance: creditBalance || 0 },
    });

    return NextResponse.json(serialize(customer));
}