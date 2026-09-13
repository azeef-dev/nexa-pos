import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const newStatus = provider.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    const updated = await prisma.provider.update({
        where: { id },
        data: { status: newStatus },
    });

    return NextResponse.json({ status: updated.status });
}

export async function DELETE(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const [saleCount, customerCount, inventoryCount] = await Promise.all([
        prisma.sale.count({ where: { providerId: id } }),
        prisma.customer.count({ where: { providerId: id } }),
        prisma.inventoryItem.count({ where: { providerId: id } }),
    ]);
    const hasHistory = saleCount > 0 || customerCount > 0 || inventoryCount > 0;

    return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}