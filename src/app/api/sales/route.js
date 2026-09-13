import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function serialize(sale) {
    return {
        ...sale,
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax),
        total: Number(sale.total),
        items: sale.items.map((i) => ({ ...i, price: Number(i.price) })),
    };
}

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
        where: { providerId: session.providerId },
        include: { items: true, customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sales.map(serialize));
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, subtotal, tax, total, customerId, isCredit } = await request.json();

    if (!items || items.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (isCredit && !customerId) {
        return NextResponse.json({ error: "Select a customer for a credit sale" }, { status: 400 });
    }

    const sale = await prisma.$transaction(async (tx) => {
        const newSale = await tx.sale.create({
            data: {
                providerId: session.providerId,
                customerId: customerId || null,
                isCredit: !!isCredit,
                subtotal,
                tax,
                total,
                items: {
                    create: items.map((item) => ({
                        inventoryItemId: item.id,
                        name: item.name,
                        price: item.price,
                        qty: item.qty,
                    })),
                },
            },
            include: { items: true, customer: { select: { name: true } } },
        });

        for (const item of items) {
            await tx.inventoryItem.update({
                where: { id: item.id },
                data: { stock: { decrement: item.qty } },
            });
        }

        if (isCredit && customerId) {
            await tx.customer.update({
                where: { id: customerId },
                data: { creditBalance: { increment: total } },
            });
            await tx.creditTransaction.create({
                data: { customerId, type: "CHARGE", amount: total, note: `Sale #${newSale.id.slice(-6)}` },
            });
        }

        return newSale;
    });

    return NextResponse.json(serialize(sale));
}