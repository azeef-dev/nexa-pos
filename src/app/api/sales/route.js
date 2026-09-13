import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TAX_RATE } from "@/lib/tax";

class InsufficientStockError extends Error {
    constructor(itemName) {
        super(`Not enough stock for "${itemName}"`);
        this.name = "InsufficientStockError";
    }
}

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

    const { items, customerId, isCredit } = await request.json();

    if (!items || items.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (isCredit && !customerId) {
        return NextResponse.json({ error: "Select a customer for a credit sale" }, { status: 400 });
    }

    const requestedIds = [...new Set(items.map((i) => i.id))];
    const dbItems = await prisma.inventoryItem.findMany({
        where: { id: { in: requestedIds }, providerId: session.providerId, isActive: true },
    });
    const dbItemsById = new Map(dbItems.map((i) => [i.id, i]));

    if (dbItems.length !== requestedIds.length) {
        return NextResponse.json(
            { error: "One or more items in the cart are no longer available" },
            { status: 404 }
        );
    }

    const invalidQty = items.some((i) => !Number.isInteger(i.qty) || i.qty <= 0);
    if (invalidQty) {
        return NextResponse.json({ error: "Item quantities must be positive whole numbers" }, { status: 400 });
    }

    // Recomputed from the DB, not trusted from the client — a tampered
    // subtotal/tax/total in the request body has no effect on what's charged.
    const computedSubtotal = items.reduce((sum, item) => sum + Number(dbItemsById.get(item.id).price) * item.qty, 0);
    const computedTax = computedSubtotal * TAX_RATE;
    const computedTotal = computedSubtotal + computedTax;

    let sale;
    try {
        sale = await prisma.$transaction(async (tx) => {
            const newSale = await tx.sale.create({
                data: {
                    providerId: session.providerId,
                    customerId: customerId || null,
                    isCredit: !!isCredit,
                    subtotal: computedSubtotal,
                    tax: computedTax,
                    total: computedTotal,
                    items: {
                        create: items.map((item) => {
                            const dbItem = dbItemsById.get(item.id);
                            return {
                                inventoryItemId: dbItem.id,
                                name: dbItem.name,
                                price: dbItem.price,
                                qty: item.qty,
                            };
                        }),
                    },
                },
                include: { items: true, customer: { select: { name: true } } },
            });

            for (const item of items) {
                // Conditional decrement: only succeeds if enough stock is still
                // there at write time, so two simultaneous sales can't both pass
                // a "stock >= qty" check and drive stock negative between them.
                const { count } = await tx.inventoryItem.updateMany({
                    where: { id: item.id, stock: { gte: item.qty } },
                    data: { stock: { decrement: item.qty } },
                });

                if (count === 0) {
                    const dbItem = dbItemsById.get(item.id);
                    throw new InsufficientStockError(dbItem.name);
                }
            }

            if (isCredit && customerId) {
                await tx.customer.update({
                    where: { id: customerId },
                    data: { creditBalance: { increment: computedTotal } },
                });
                await tx.creditTransaction.create({
                    data: { customerId, type: "CHARGE", amount: computedTotal, note: `Sale #${newSale.id.slice(-6)}` },
                });
            }

            return newSale;
        });
    } catch (err) {
        if (err instanceof InsufficientStockError) {
            return NextResponse.json({ error: err.message }, { status: 409 });
        }
        throw err;
    }

    return NextResponse.json(serialize(sale));
}