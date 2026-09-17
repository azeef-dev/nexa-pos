import { prisma } from "@/lib/prisma";
import { TAX_RATE } from "@/lib/tax";

export class InsufficientStockError extends Error {
    constructor(itemName) {
        super(`Not enough stock for ${itemName}`);
        this.name = "InsufficientStockError";
    }
}

export class ItemsUnavailableError extends Error {
    constructor() {
        super("One or more items in the cart are no longer available");
        this.name = "ItemsUnavailableError";
    }
}

// Shared by the in-app POS checkout (api/sales) and the WhatsApp order
// assistant, so both go through the exact same stock-safe transaction —
// same conditional decrement, same credit-tab charge behavior.
export async function createSale({ providerId, items, customerId, branchId, isCredit }) {
    const itemIds = items.map((i) => i.id);
    const dbItems = await prisma.inventoryItem.findMany({
        where: { id: { in: itemIds }, providerId, isActive: true },
    });

    if (dbItems.length !== itemIds.length) {
        throw new ItemsUnavailableError();
    }

    const priceMap = Object.fromEntries(dbItems.map((i) => [i.id, i]));
    const subtotal = items.reduce((sum, item) => sum + Number(priceMap[item.id].price) * item.qty, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const sale = await prisma.$transaction(
        async (tx) => {
            const newSale = await tx.sale.create({
                data: {
                    providerId,
                    customerId: customerId || null,
                    branchId: branchId || null,
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
                include: { items: true, customer: { select: { name: true } }, branch: { select: { name: true } } },
            });

            await Promise.all(
                items.map(async (item) => {
                    // Conditional decrement: only succeeds if stock is still
                    // enough at write time, so two simultaneous orders (POS +
                    // WhatsApp, or two WhatsApp customers) can't both pass an
                    // earlier stock check and oversell the same item.
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

    return sale;
}

export function serializeSale(sale) {
    return {
        ...sale,
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax),
        total: Number(sale.total),
        items: sale.items.map((i) => ({ ...i, price: Number(i.price) })),
    };
}