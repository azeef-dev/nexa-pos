import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { inventoryItemSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

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

    const { data, error } = validateBody(inventoryItemSchema, await request.json());
    if (error) return error;
    const { name, category, price, stock, branchId } = data;

    if (branchId) {
        const branch = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!branch || branch.providerId !== session.providerId) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }
    }

    const item = await prisma.inventoryItem.update({
        where: { id },
        data: { name, category, price, stock, branchId: branchId || null },
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