import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    const { amount, note } = await request.json();

    if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Enter a valid payment amount" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.providerId !== session.providerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
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