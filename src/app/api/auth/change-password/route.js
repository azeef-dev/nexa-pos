import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

export async function POST(request) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(changePasswordSchema, await request.json());
    if (error) return error;
    const { currentPassword, newPassword } = data;

    const account = await prisma.account.findUnique({ where: { id: session.accountId } });
    if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, account.passwordHash);
    if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.account.update({ where: { id: account.id }, data: { passwordHash } });

    return NextResponse.json({ success: true });
}
