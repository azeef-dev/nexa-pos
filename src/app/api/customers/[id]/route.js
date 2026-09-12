import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer || customer.providerId !== session.providerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
}