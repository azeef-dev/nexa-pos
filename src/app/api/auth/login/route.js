import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
        where: { email },
        include: { provider: true, staffOf: true },
    });

    if (!account) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, account.passwordHash);
    if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // An owner logs in with an account that owns a Provider (account.provider);
    // a staff/cashier login instead points at the provider it belongs to via
    // staffOf. Either way this resolves to "which business is this session for".
    const provider = account.provider || account.staffOf;

    if (account.role === "PROVIDER" && provider?.status === "SUSPENDED") {
        return NextResponse.json({ error: "Your account has been suspended" }, { status: 403 });
    }

    const token = await signToken({
        accountId: account.id,
        role: account.role,
        providerId: provider?.id || null,
    });

    const response = NextResponse.json({
        role: account.role,
        redirectTo: account.role === "SUPER_ADMIN" ? "/super-admin" : "/provider",
    });

    response.cookies.set("nexapos_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return response;
}