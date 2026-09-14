import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { creditPaymentSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

class OverpaymentError extends Error {}

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

    let transaction;
    try {
        transaction = await prisma.$transaction(async (tx) => {
            // Conditional decrement: only succeeds if the balance is still
            // >= amount at write time, so two simultaneous payments on the
            // same tab can't both pass the check above and overdraw it.
            const { count } = await tx.customer.updateMany({
                where: { id, creditBalance: { gte: amount } },
                data: { creditBalance: { decrement: amount } },
            });

            if (count === 0) {
                throw new OverpaymentError();
            }

            return tx.creditTransaction.create({
                data: { customerId: id, type: "PAYMENT", amount, note: note || null },
            });
        });
    } catch (err) {
        if (err instanceof OverpaymentError) {
            return NextResponse.json({ error: "Payment cannot exceed the outstanding balance" }, { status: 409 });
        }
        throw err;
    }

    return NextResponse.json({ ...transaction, amount: Number(transaction.amount) });
}