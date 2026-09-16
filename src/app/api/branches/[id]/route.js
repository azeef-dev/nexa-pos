import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { branchSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

export async function PATCH(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.branch.findUnique({ where: { id } });

    if (!existing || existing.providerId !== session.providerId) {
        return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const { data, error } = validateBody(branchSchema, await request.json());
    if (error) return error;
    const { name, address } = data;

    const branch = await prisma.branch.update({
        where: { id },
        data: { name, address: address || null },
    });

    return NextResponse.json(branch);
}

export async function DELETE(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.branch.findUnique({ where: { id } });

    if (!existing || existing.providerId !== session.providerId) {
        return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    await prisma.$transaction([
        prisma.inventoryItem.updateMany({ where: { branchId: id }, data: { branchId: null } }),
        prisma.sale.updateMany({ where: { branchId: id }, data: { branchId: null } }),
        prisma.branch.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
}
