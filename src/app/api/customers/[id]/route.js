import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function serialize(customer) {
    return { ...customer, creditBalance: Number(customer.creditBalance) };
}

export async function PATCH(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.customer.findUnique({ where: { id } });

    if (!existing || existing.providerId !== session.providerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { name, phone } = await request.json();

    if (!name || !phone) {
        return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    // creditBalance is intentionally not editable here — it's only ever
    // changed via the /credit endpoint so the CreditTransaction ledger
    // stays the single source of truth for it.
    const customer = await prisma.customer.update({
        where: { id },
        data: { name, phone },
    });

    return NextResponse.json(serialize(customer));
}

export async function DELETE(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer || customer.providerId !== session.providerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [saleCount, creditCount] = await Promise.all([
        prisma.sale.count({ where: { customerId: id } }),
        prisma.creditTransaction.count({ where: { customerId: id } }),
    ]);

    if (saleCount > 0 || creditCount > 0) {
        await prisma.customer.update({ where: { id }, data: { isActive: false } });
        return NextResponse.json({ success: true, archived: true });
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true, archived: false });
}