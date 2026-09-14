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

    return [getTodaysSummary, getLowStockItems];
}
