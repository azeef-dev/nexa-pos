import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";
import { chatSchema } from "@/lib/schemas";
import { validateBody } from "@/lib/validate-request";
import { buildTools } from "@/lib/chat-tools";

const client = new Anthropic();

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

    let finalMessage;
    try {
        finalMessage = await client.beta.messages.toolRunner({
            model: "claude-opus-5",
            max_tokens: 4096,
            output_config: { effort: "low" },
            system: SYSTEM_PROMPT,
            tools,
            messages,
        });
    } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) {
            return NextResponse.json({ error: "Assistant is misconfigured (invalid API key)." }, { status: 500 });
        }
        if (err instanceof Anthropic.RateLimitError) {
            return NextResponse.json({ error: "Assistant is busy right now — try again in a moment." }, { status: 429 });
        }
        if (err instanceof Anthropic.APIError) {
            // Covers billing/credit and other invalid-request cases from the
            // Anthropic account itself — safe to surface, it's operational
            // detail the shop owner can't fix but the app operator needs to see.
            return NextResponse.json({ error: `Assistant unavailable: ${err.message}` }, { status: 502 });
        }
        throw err;
    }

    const reply = finalMessage.content.find((b) => b.type === "text")?.text || "";

    return NextResponse.json({ reply });
}
