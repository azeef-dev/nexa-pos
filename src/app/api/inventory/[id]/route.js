import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function serialize(item) {
    return { ...item, price: Number(item.price) };
}

export async function PATCH(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });

    if (!existing || existing.providerId !== session.providerId) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { name, category, price, stock } = await request.json();

    if (!name || !category || price === undefined || stock === undefined) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (Number(price) <= 0) {
        return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
    }

    if (Number(stock) < 0) {
        return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.update({
        where: { id },
        data: { name, category, price, stock },
    });

    return NextResponse.json(serialize(item));
}

export async function DELETE(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const item = await prisma.inventoryItem.findUnique({ where: { id } });

    if (!item || item.providerId !== session.providerId) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const saleCount = await prisma.saleItem.count({ where: { inventoryItemId: id } });

    if (saleCount > 0) {
        await prisma.inventoryItem.update({ where: { id }, data: { isActive: false } });
        return NextResponse.json({ success: true, archived: true });
    }

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true, archived: false });
}