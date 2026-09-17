// Tools for the WhatsApp order assistant (api/webhooks/whatsapp/route.js).
// Same pattern as lib/chat-tools.js (every tool closes over providerId so the
// model can't be talked into touching another business's data), plus each
// tool reads/writes `session.cart` in place so an order survives across
// separate webhook requests — every incoming WhatsApp message is its own
// stateless HTTP call, so the caller persists session.cart afterward.

import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { prisma } from "@/lib/prisma";
import { TAX_RATE } from "@/lib/tax";
import { createSale, serializeSale, InsufficientStockError, ItemsUnavailableError } from "@/lib/create-sale";

function cartTotals(cart) {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = subtotal * TAX_RATE;
    return { subtotal, tax, total: subtotal + tax };
}

export function buildOrderTools(session) {
    const { providerId } = session;

    const listCategories = betaZodTool({
        name: "list_categories",
        description: "List the product categories this store sells.",
        inputSchema: z.object({}),
        run: async () => {
            const items = await prisma.inventoryItem.findMany({
                where: { providerId, isActive: true },
                distinct: ["category"],
                select: { category: true },
            });
            return JSON.stringify(items.map((i) => i.category));
        },
    });

    const searchProducts = betaZodTool({
        name: "search_products",
        description: "Search this store's inventory by name and/or category. Only returns items currently in stock.",
        inputSchema: z.object({
            query: z.string().optional().describe("Text to match against the item name"),
            category: z.string().optional(),
        }),
        run: async ({ query, category }) => {
            const items = await prisma.inventoryItem.findMany({
                where: {
                    providerId,
                    isActive: true,
                    stock: { gt: 0 },
                    ...(category ? { category } : {}),
                    ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
                },
                select: { id: true, name: true, price: true, stock: true, category: true },
                take: 20,
            });
            return JSON.stringify(items.map((i) => ({ ...i, price: Number(i.price) })));
        },
    });

    const addToCart = betaZodTool({
        name: "add_to_cart",
        description: "Add a quantity of one item to the customer's order. Call search_products first to get the itemId.",
        inputSchema: z.object({
            itemId: z.string(),
            qty: z.number().int().positive(),
        }),
        run: async ({ itemId, qty }) => {
            const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, providerId, isActive: true } });
            if (!item) return JSON.stringify({ error: "Item not found" });

            const existing = session.cart.find((c) => c.id === itemId);
            const currentQty = existing?.qty || 0;
            if (item.stock < currentQty + qty) {
                return JSON.stringify({ error: `Only ${item.stock} of ${item.name} in stock` });
            }

            if (existing) {
                existing.qty += qty;
            } else {
                session.cart.push({ id: item.id, name: item.name, price: Number(item.price), qty });
            }

            return JSON.stringify({ cart: session.cart, ...cartTotals(session.cart) });
        },
    });

    const removeFromCart = betaZodTool({
        name: "remove_from_cart",
        description: "Remove an item entirely from the customer's order.",
        inputSchema: z.object({ itemId: z.string() }),
        run: async ({ itemId }) => {
            session.cart = session.cart.filter((c) => c.id !== itemId);
            return JSON.stringify({ cart: session.cart, ...cartTotals(session.cart) });
        },
    });

    const viewCart = betaZodTool({
        name: "view_cart",
        description: "Show the customer's current order and running total.",
        inputSchema: z.object({}),
        run: async () => JSON.stringify({ cart: session.cart, ...cartTotals(session.cart) }),
    });

    const checkout = betaZodTool({
        name: "checkout",
        description: "Place the order once the customer has confirmed everything in their cart. Creates the sale and clears the cart.",
        inputSchema: z.object({}),
        run: async () => {
            if (session.cart.length === 0) {
                return JSON.stringify({ error: "Cart is empty — add items before checking out" });
            }
            try {
                const sale = await createSale({
                    providerId,
                    items: session.cart.map((c) => ({ id: c.id, qty: c.qty })),
                    customerId: session.customerId || null,
                });
                session.cart = [];
                return JSON.stringify({ success: true, sale: serializeSale(sale) });
            } catch (err) {
                if (err instanceof InsufficientStockError || err instanceof ItemsUnavailableError) {
                    return JSON.stringify({ error: err.message });
                }
                throw err;
            }
        },
    });

    const getCreditBalance = betaZodTool({
        name: "get_credit_balance",
        description: "Look up how much the customer currently owes on their credit tab, if they have one on file.",
        inputSchema: z.object({}),
        run: async () => {
            if (!session.customerId) return JSON.stringify({ error: "No customer account found for this number" });
            const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
            return JSON.stringify({ creditBalance: Number(customer?.creditBalance || 0) });
        },
    });

    return [listCategories, searchProducts, addToCart, removeFromCart, viewCart, checkout, getCreditBalance];
}