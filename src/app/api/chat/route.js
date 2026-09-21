import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chatSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";
import { buildTools } from "@/lib/chat-tools";
import { runToolLoop } from "@/lib/groq";

const SYSTEM_PROMPT = `You are the business assistant built into NexaPOS, a point-of-sale app.
You answer questions about the current provider's own store — sales, inventory, customers, and credit tabs — using the tools available to you. Always call a tool to get real numbers; never guess or make up figures.
Currency is Pakistani Rupees (Rs.). Reply in whichever language the user asks in (Urdu, English, or Roman Urdu). Keep answers short and to the point — this is a chat widget, not a report.
If a question is outside your scope (not about this store's own data), say so briefly.`;

export async function POST(request) {
    const session = await getSession(request);
    if (!session || session.role !== "PROVIDER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = validateBody(chatSchema, await request.json());
    if (error) return error;
    const { messages } = data;

    const tools = buildTools(session.providerId);

    let reply;
    try {
        reply = await runToolLoop({ system: SYSTEM_PROMPT, messages, tools });
    } catch (err) {
        console.error("Business assistant error:", err);
        return NextResponse.json({ error: "Assistant is temporarily unavailable" }, { status: 502 });
    }

    return NextResponse.json({ reply });
}