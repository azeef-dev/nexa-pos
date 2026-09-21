import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, verifyWebhookChallenge } from "@/lib/whatsapp";
import { buildOrderTools } from "@/lib/whatsapp-order-tools";
import { runToolLoop } from "@/lib/groq";

const SYSTEM_PROMPT = `You are the ordering assistant for a shop, talking directly to a customer on WhatsApp.
Help them browse products, build an order, and check out. Always use your tools to look up real
products, prices and stock — never invent them. Read back the full cart and total and get the
customer's confirmation before calling checkout. Keep replies short and friendly, like a real
WhatsApp chat, not a report. Reply in whichever language the customer writes in (Urdu, English or
Roman Urdu).`;

export async function GET(request) {
    const challenge = verifyWebhookChallenge(request.nextUrl.searchParams);
    if (challenge === null) {
        return NextResponse.json({ error: "Verification failed" }, { status: 403 });
    }
    return new NextResponse(challenge, { status: 200 });
}

export async function POST(request) {
    const body = await request.json();

    const change = body?.entry?.[0]?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message || message.type !== "text") {
        return NextResponse.json({ success: true });
    }

    const phoneNumberId = change.metadata?.phone_number_id;
    const from = message.from;
    const text = message.text?.body || "";

    const provider = await prisma.provider.findUnique({ where: { whatsappPhoneNumberId: phoneNumberId } });
    if (!provider) {
        console.error("WhatsApp message for unregistered phone_number_id:", phoneNumberId);
        return NextResponse.json({ success: true });
    }

    const customer = await prisma.customer.findFirst({
        where: { providerId: provider.id, phone: { contains: from.slice(-10) } },
    });

    const dbSession = await prisma.whatsAppSession.upsert({
        where: { providerId_customerPhone: { providerId: provider.id, customerPhone: from } },
        update: {},
        create: { providerId: provider.id, customerPhone: from, cart: [], history: [] },
    });

    const session = {
        providerId: provider.id,
        customerId: customer?.id || null,
        cart: Array.isArray(dbSession.cart) ? dbSession.cart : [],
    };

    const history = Array.isArray(dbSession.history) ? dbSession.history : [];
    const messages = [...history, { role: "user", content: text }];
    const tools = buildOrderTools(session);

    let reply;
    try {
        reply = await runToolLoop({ system: SYSTEM_PROMPT, messages, tools });
    } catch (err) {
        console.error("WhatsApp order assistant error:", err);
        await sendWhatsAppText(phoneNumberId, from, "Sorry, something went wrong on our end — please try again in a moment.");
        return NextResponse.json({ success: true });
    }

    const updatedHistory = [...messages, { role: "assistant", content: reply }].slice(-20);

    await prisma.whatsAppSession.update({
        where: { providerId_customerPhone: { providerId: provider.id, customerPhone: from } },
        data: { cart: session.cart, history: updatedHistory },
    });

    await sendWhatsAppText(phoneNumberId, from, reply || "Sorry, I didn't catch that.");

    return NextResponse.json({ success: true });
}