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
        include: { branch: { select: { name: true } } },
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
    const { name, category, price, stock, branchId } = data;

    if (branchId) {
        const branch = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!branch || branch.providerId !== session.providerId) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }
    }

    const item = await prisma.inventoryItem.create({
        data: { providerId: session.providerId, name, category, price, stock, branchId: branchId || null },
    });

    return NextResponse.json(serialize(item));
}