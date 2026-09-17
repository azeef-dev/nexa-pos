import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

// Sends a WhatsApp template message reminding the customer of their credit
// tab balance. Requires a template named `credit_reminder`, category
// "Utility", approved in Meta Business Manager — e.g. body text:
// "Hi {{1}}, this is {{3}} — a friendly reminder that you have Rs. {{2}}
// outstanding on your account."
export async function POST(request, { params }) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [customer, provider] = await Promise.all([
        prisma.customer.findUnique({ where: { id } }),
        prisma.provider.findUnique({ where: { id: session.providerId } }),
    ]);

    if (!customer || customer.providerId !== session.providerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    if (!provider.whatsappPhoneNumberId) {
        return NextResponse.json({ error: "Connect a WhatsApp number in Settings first" }, { status: 400 });
    }
    if (Number(customer.creditBalance) <= 0) {
        return NextResponse.json({ error: "This customer has no outstanding balance" }, { status: 400 });
    }

    try {
        await sendWhatsAppTemplate(
            provider.whatsappPhoneNumberId,
            customer.phone,
            "credit_reminder",
            [customer.name, Number(customer.creditBalance).toFixed(2), provider.businessName],
            { category: "utility" }
        );
    } catch (err) {
        return NextResponse.json({ error: err.message || "Failed to send reminder" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
}