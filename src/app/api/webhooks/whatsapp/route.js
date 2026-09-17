import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, verifyWebhookChallenge } from "@/lib/whatsapp";
import { buildOrderTools } from "@/lib/whatsapp-order-tools";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are the ordering assistant for a shop, talking directly to a customer on WhatsApp.
Help them browse products, build an order, and check out. Always use your tools to look up real
products, prices and stock — never invent them. Read back the full cart and total and get the
customer's confirmation before calling checkout. Keep replies short and friendly, like a real
WhatsApp chat, not a report. Reply in whichever language the customer writes in (Urdu, English or
Roman Urdu).`;

// Meta calls this once when you save the webhook URL in the App Dashboard.
export async function GET(request) {
    const challenge = verifyWebhookChallenge(request.nextUrl.searchParams);
    if (challenge === null) {
        return NextResponse.json({ error: "Verification failed" }, { status: 403 });
    }
    return new NextResponse(challenge, { status: 200 });
}

export async function POST(request) {
    const body = await request.json();

    // Meta's payload can technically batch several changes; in practice each
    // webhook call carries exactly one incoming message.
    const change = body?.entry?.[0]?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message || message.type !== "text") {
        // Ignore delivery/read-receipt callbacks and non-text messages for now.
        return NextResponse.json({ success: true });
    }

    const phoneNumberId = change.metadata?.phone_number_id;
    const from = message.from; // customer's WhatsApp number, digits only
    const text = message.text?.body || "";

    const provider = await prisma.provider.findUnique({ where: { whatsappPhoneNumberId: phoneNumberId } });
    if (!provider) {
        console.error("WhatsApp message for unregistered phone_number_id:", phoneNumberId);
        return NextResponse.json({ success: true });
    }

    // Matching by the last 10 digits since Customer.phone is free-typed text
    // rather than normalized E.164 — good enough for one country's numbers,
    // worth tightening if this goes beyond a course project.
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

    let finalMessage;
    try {
        finalMessage = await client.beta.messages.toolRunner({
            model: "claude-opus-5",
            max_tokens: 1024,
            output_config: { effort: "low" },
            system: SYSTEM_PROMPT,
            tools,
            messages,
        });
    } catch (err) {
        console.error("WhatsApp order assistant error:", err);
        await sendWhatsAppText(phoneNumberId, from, "Sorry, something went wrong on our end — please try again in a moment.");
        return NextResponse.json({ success: true });
    }

    const reply = finalMessage.content.find((b) => b.type === "text")?.text || "Sorry, I didn't catch that.";

    // Keep the stored transcript short — this backs a chat window, not a full log.
    const updatedHistory = [...messages, { role: "assistant", content: reply }].slice(-20);

    await prisma.whatsAppSession.update({
        where: { providerId_customerPhone: { providerId: provider.id, customerPhone: from } },
        data: { cart: session.cart, history: updatedHistory },
    });

    await sendWhatsAppText(phoneNumberId, from, reply);

    return NextResponse.json({ success: true });
}