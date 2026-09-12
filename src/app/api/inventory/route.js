import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function serialize(item) {
    return { ...item, price: Number(item.price) };
}

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.inventoryItem.findMany({
        where: { providerId: session.providerId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items.map(serialize));
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, category, price, stock } = await request.json();

    if (!name || !category || price === undefined || stock === undefined) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
        data: { providerId: session.providerId, name, category, price, stock },
    });

    return NextResponse.json(serialize(item));
}