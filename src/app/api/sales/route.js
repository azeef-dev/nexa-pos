import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const TAX_RATE = 0.05;

const saleItemSchema = z.object({
    id: z.string().min(1),
    qty: z.coerce.number().int().positive(),
});

const saleSchema = z.object({
    items: z.array(saleItemSchema).min(1, "Cart is empty"),
    customerId: z.string().nullable().optional(),
    isCredit: z.boolean().optional(),
});

class InsufficientStockError extends Error {
    constructor(itemName) {
        super(`Not enough stock for ${itemName}`);
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

    const body = await request.json();
    const parsed = saleSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
    }

    const { items, customerId, isCredit } = parsed.data;

    if (isCredit && !customerId) {
        return NextResponse.json({ error: "Select a customer for a credit sale" }, { status: 400 });
    }

    const itemIds = items.map((i) => i.id);
    const dbItems = await prisma.inventoryItem.findMany({
        where: { id: { in: itemIds }, providerId: session.providerId, isActive: true },
    });

    if (dbItems.length !== itemIds.length) {
        return NextResponse.json({ error: "One or more items in the cart are no longer available" }, { status: 404 });
    }

    const priceMap = Object.fromEntries(dbItems.map((i) => [i.id, i]));
    const subtotal = items.reduce((sum, item) => sum + Number(priceMap[item.id].price) * item.qty, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    try {
        const sale = await prisma.$transaction(
            async (tx) => {
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
                                name: priceMap[item.id].name,
                                price: priceMap[item.id].price,
                                qty: item.qty,
                            })),
                        },
                    },
                    include: { items: true, customer: { select: { name: true } } },
                });

                await Promise.all(
                    items.map(async (item) => {
                        const result = await tx.inventoryItem.updateMany({
                            where: { id: item.id, stock: { gte: item.qty } },
                            data: { stock: { decrement: item.qty } },
                        });
                        if (result.count === 0) {
                            throw new InsufficientStockError(priceMap[item.id].name);
                        }
                    })
                );

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
            },
            { timeout: 15000 }
        );

        return NextResponse.json(serialize(sale));
    } catch (error) {
        if (error instanceof InsufficientStockError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        throw error;
    }
}