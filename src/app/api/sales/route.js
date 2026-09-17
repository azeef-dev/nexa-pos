import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saleSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";
import { createSale, serializeSale, InsufficientStockError, ItemsUnavailableError } from "@/lib/create-sale";

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
        where: { providerId: session.providerId },
        include: { items: true, customer: { select: { name: true } }, branch: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sales.map(serializeSale));
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(saleSchema, await request.json());
    if (error) return error;
    const { items, customerId, branchId, isCredit } = data;

    try {
        const sale = await createSale({ providerId: session.providerId, items, customerId, branchId, isCredit });
        return NextResponse.json(serializeSale(sale));
    } catch (err) {
        if (err instanceof InsufficientStockError) {
            return NextResponse.json({ error: err.message }, { status: 409 });
        }
        if (err instanceof ItemsUnavailableError) {
            return NextResponse.json({ error: err.message }, { status: 404 });
        }
        throw err;
    }
}