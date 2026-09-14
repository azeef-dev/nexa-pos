// Tools for the provider business-assistant chat (src/app/api/chat/route.js).
// Every tool closes over `providerId` from the authenticated session — the
// model is never given a providerId parameter, so it cannot be talked into
// (or tricked via prompt injection into) querying another business's data.

import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { prisma } from "@/lib/prisma";

function startOfUtcDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function buildTools(providerId) {
    const getTodaysSummary = betaZodTool({
        name: "get_todays_summary",
        description: "Get today's total sales amount and number of sales for this store.",
        inputSchema: z.object({}),
        run: async () => {
            const today = startOfUtcDay(new Date());
            const sales = await prisma.sale.findMany({
                where: { providerId, createdAt: { gte: today } },
                select: { total: true },
            });
            const total = sales.reduce((sum, s) => sum + Number(s.total), 0);
            return JSON.stringify({ salesCount: sales.length, totalRs: total });
        },
    });

    const getLowStockItems = betaZodTool({
        name: "get_low_stock_items",
        description: "Get inventory items that are low on stock (at or below a threshold, default 10 units) or out of stock.",
        inputSchema: z.object({
            threshold: z.number().int().min(0).optional().describe("Stock level to consider 'low'. Defaults to 10."),
        }),
        run: async ({ threshold }) => {
            const items = await prisma.inventoryItem.findMany({
                where: { providerId, isActive: true, stock: { lte: threshold ?? 10 } },
                select: { name: true, stock: true, category: true },
                orderBy: { stock: "asc" },
                take: 20,
            });
            return JSON.stringify(items);
        },
    });

    const getTopProducts = betaZodTool({
        name: "get_top_products",
        description: "Get the best-selling products (by quantity sold) over a recent number of days.",
        inputSchema: z.object({
            days: z.number().int().min(1).max(90).optional().describe("How many days back to look. Defaults to 30, max 90."),
        }),
        run: async ({ days }) => {
            const windowStart = new Date(Date.now() - (days ?? 30) * 24 * 60 * 60 * 1000);
            const sales = await prisma.sale.findMany({
                where: { providerId, createdAt: { gte: windowStart } },
                include: { items: true },
            });
            const qtyByProduct = new Map();
            for (const sale of sales) {
                for (const item of sale.items) {
                    qtyByProduct.set(item.name, (qtyByProduct.get(item.name) || 0) + item.qty);
                }
            }
            const topProducts = [...qtyByProduct.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, qty]) => ({ name, qty }));
            return JSON.stringify(topProducts);
        },
    });

    const getCustomersWithBalance = betaZodTool({
        name: "get_customers_with_balance",
        description: "Get customers who currently owe money on their credit tab (outstanding balance), sorted highest first.",
        inputSchema: z.object({}),
        run: async () => {
            const customers = await prisma.customer.findMany({
                where: { providerId, isActive: true, creditBalance: { gt: 0 } },
                select: { name: true, phone: true, creditBalance: true },
                orderBy: { creditBalance: "desc" },
                take: 20,
            });
            return JSON.stringify(customers.map((c) => ({ ...c, creditBalance: Number(c.creditBalance) })));
        },
    });

    const getSalesInRange = betaZodTool({
        name: "get_sales_in_range",
        description: "Get total sales amount and count of sales between two dates (inclusive). Dates are YYYY-MM-DD. Range is capped at 90 days.",
        inputSchema: z.object({
            startDate: z.string().describe("Start date, YYYY-MM-DD"),
            endDate: z.string().describe("End date, YYYY-MM-DD"),
        }),
        run: async ({ startDate, endDate }) => {
            const start = new Date(`${startDate}T00:00:00.000Z`);
            const end = new Date(`${endDate}T23:59:59.999Z`);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
                return JSON.stringify({ error: "Invalid date range" });
            }
            const cappedEnd = Math.min(end.getTime(), start.getTime() + 90 * 24 * 60 * 60 * 1000);

            const sales = await prisma.sale.findMany({
                where: { providerId, createdAt: { gte: start, lte: new Date(cappedEnd) } },
                select: { total: true },
            });
            const totalRs = sales.reduce((sum, s) => sum + Number(s.total), 0);
            return JSON.stringify({ salesCount: sales.length, totalRs });
        },
    });

    return [getTodaysSummary, getLowStockItems, getTopProducts, getCustomersWithBalance, getSalesInRange];
}
