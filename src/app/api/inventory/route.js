import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { inventoryItemSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

function serialize(item) {
    return { ...item, price: Number(item.price) };
}

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.inventoryItem.findMany({
        where: { providerId: session.providerId, isActive: true },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items.map(serialize));
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(inventoryItemSchema, await request.json());
    if (error) return error;
    const { name, category, price, stock } = data;

    const item = await prisma.inventoryItem.create({
        data: { providerId: session.providerId, name, category, price, stock },
    });

    return NextResponse.json(serialize(item));
}