import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Day-bucketing below uses UTC calendar days (server clock), not the
// viewer's local timezone — fine for a single-region deployment, but a
// multi-timezone rollout would want a tz-aware bucketing pass here.
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const today = startOfUtcDay(now);
    const windowStart = new Date(today.getTime() - 29 * DAY_MS); // 30-day window, bounded so this never scans full sales history

    const [recentSales, totalCustomers] = await Promise.all([
        prisma.sale.findMany({
            where: { providerId: session.providerId, createdAt: { gte: windowStart } },
            include: { items: true },
            orderBy: { createdAt: "asc" },
        }),
        prisma.customer.count({ where: { providerId: session.providerId, isActive: true } }),
    ]);

    const todaysSales = recentSales
        .filter((s) => s.createdAt >= today)
        .reduce((sum, s) => sum + Number(s.total), 0);

    return NextResponse.json({ todaysSales, totalCustomers });
}
