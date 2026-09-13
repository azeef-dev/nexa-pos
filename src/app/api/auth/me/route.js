import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "PROVIDER") {
        const provider = await prisma.provider.findUnique({ where: { id: session.providerId } });
        return NextResponse.json({ role: session.role, businessName: provider?.businessName || "NexaPOS" });
    }

    return NextResponse.json({ role: session.role, businessName: "NexaPOS" });
}