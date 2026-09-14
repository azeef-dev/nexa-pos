import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { branchSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branches = await prisma.branch.findMany({
        where: { providerId: session.providerId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(branches);
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(branchSchema, await request.json());
    if (error) return error;
    const { name, address } = data;

    const branch = await prisma.branch.create({
        data: { providerId: session.providerId, name, address: address || null },
    });

    return NextResponse.json(branch);
}
