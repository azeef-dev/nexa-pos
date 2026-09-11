import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request) {
    const token = request.cookies.get("nexapos_token")?.value;
    const { pathname } = request.nextUrl;

    const payload = token ? await verifyToken(token) : null;

    const isAuthRoute = pathname.startsWith("/login");
    const isProtectedRoute = pathname.startsWith("/provider") || pathname.startsWith("/super-admin");

    if (!payload && isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (payload && isAuthRoute) {
        const home = payload.role === "SUPER_ADMIN" ? "/super-admin" : "/provider";
        return NextResponse.redirect(new URL(home, request.url));
    }

    if (payload && pathname.startsWith("/super-admin") && payload.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/provider", request.url));
    }

    if (payload && pathname.startsWith("/provider") && payload.role !== "PROVIDER") {
        return NextResponse.redirect(new URL("/super-admin", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/login", "/provider/:path*", "/super-admin/:path*"],
};