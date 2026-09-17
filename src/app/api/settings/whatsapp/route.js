import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { whatsappSettingsSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";

export async function GET(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = await prisma.provider.findUnique({ where: { id: session.providerId } });
    return NextResponse.json({ whatsappPhoneNumberId: provider?.whatsappPhoneNumberId || "" });
}

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(whatsappSettingsSchema, await request.json());
    if (error) return error;

    const existing = await prisma.provider.findUnique({ where: { whatsappPhoneNumberId: data.whatsappPhoneNumberId } });
    if (existing && existing.id !== session.providerId) {
        return NextResponse.json({ error: "This WhatsApp number is already connected to another business" }, { status: 409 });
    }

    await prisma.provider.update({
        where: { id: session.providerId },
        data: { whatsappPhoneNumberId: data.whatsappPhoneNumberId },
    });

    return NextResponse.json({ success: true });
}