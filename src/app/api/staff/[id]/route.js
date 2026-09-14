import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const account = await prisma.account.findUnique({ where: { id } });

    // staffOfId is only ever set on staff logins (never on an owner account),
    // so this can't be used to delete the provider's own owner account.
    if (!account || account.staffOfId !== session.providerId) {
        return NextResponse.json({ error: "Staff account not found" }, { status: 404 });
    }

    await prisma.account.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
