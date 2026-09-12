import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
}