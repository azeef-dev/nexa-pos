import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { creditPaymentSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

export async function GET(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.providerId !== session.providerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const transactions = await prisma.creditTransaction.findMany({
        where: { customerId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return NextResponse.json(transactions.map((t) => ({ ...t, amount: Number(t.amount) })));
}

export async function POST(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { data, error } = validateBody(creditPaymentSchema, await request.json());
    if (error) return error;
    const { amount, note } = data;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.providerId !== session.providerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (amount > Number(customer.creditBalance)) {
        return NextResponse.json(
            { error: `Payment cannot exceed the outstanding balance of Rs. ${Number(customer.creditBalance).toFixed(2)}` },
            { status: 409 }
        );
    }

    const [, transaction] = await prisma.$transaction([
        prisma.customer.update({
            where: { id },
            data: { creditBalance: { decrement: amount } },
        }),
        prisma.creditTransaction.create({
            data: { customerId: id, type: "PAYMENT", amount, note: note || null },
        }),
    ]);

    return NextResponse.json({ ...transaction, amount: Number(transaction.amount) });
}