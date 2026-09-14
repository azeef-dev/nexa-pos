import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
        where: { providerId: session.providerId, createdAt: { gte: since } },
        include: { items: true },
        orderBy: { createdAt: "asc" },
    });

    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    sales.forEach((sale) => {
        const key = sale.createdAt.toISOString().slice(0, 10);
        if (dailyMap[key] !== undefined) dailyMap[key] += Number(sale.total);
    });
    const dailySales = Object.entries(dailyMap).map(([date, total]) => ({
        date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        total: Number(total.toFixed(2)),
    }));

    const itemMap = {};
    sales.forEach((sale) => {
        sale.items.forEach((item) => {
            itemMap[item.name] = (itemMap[item.name] || 0) + item.qty;
        });
    });
    const bestSellers = Object.entries(itemMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));

    const saleItemIds = [...new Set(sales.flatMap((s) => s.items.map((i) => i.inventoryItemId)))];
    const inventoryItems = await prisma.inventoryItem.findMany({
        where: { id: { in: saleItemIds } },
        select: { id: true, category: true },
    });
    const categoryOf = Object.fromEntries(inventoryItems.map((i) => [i.id, i.category]));

    const categoryMap = {};
    sales.forEach((sale) => {
        sale.items.forEach((item) => {
            const category = categoryOf[item.inventoryItemId] || "Others";
            categoryMap[category] = (categoryMap[category] || 0) + item.price * item.qty;
        });
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([category, total]) => ({
        category,
        total: Number(Number(total).toFixed(2)),
    }));

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return NextResponse.json({
        dailySales,
        bestSellers,
        categoryBreakdown,
        summary: {
            totalRevenue: Number(totalRevenue.toFixed(2)),
            totalOrders,
            avgOrderValue: Number(avgOrderValue.toFixed(2)),
        },
    });
}