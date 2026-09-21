import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// llama-3.1-8b-instant — fast and broadly available on every Groq account
// tier, with tool-calling support. If your console shows a bigger model
// (e.g. llama-3.3-70b-versatile, openai/gpt-oss-120b) also marked "Tool use",
// feel free to swap it in here.
export const GROQ_MODEL = "llama-3.1-8b-instant";

const MAX_TURNS = 6;

// Groq's chat.completions API is OpenAI-compatible and has no equivalent to
// Anthropic's toolRunner helper, so this hand-rolls the same loop: call the
// model, run whichever tools it asks for, feed the results back in, repeat
// until it answers in plain text (or MAX_TURNS is hit as a safety valve).
export async function runToolLoop({ system, messages, tools }) {
    const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));
    const apiTools = tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    const conversation = [{ role: "system", content: system }, ...messages];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: conversation,
            tools: apiTools,
        });

        const message = response.choices[0].message;
        conversation.push(message);

        if (!message.tool_calls?.length) {
            return message.content || "";
        }

        for (const call of message.tool_calls) {
            const tool = toolMap[call.function.name];
            let result;
            if (!tool) {
                result = JSON.stringify({ error: `Unknown tool: ${call.function.name}` });
            } else {
                let args = {};
                try {
                    args = JSON.parse(call.function.arguments || "{}");
                } catch {
                    // Malformed arguments — let the tool see an empty object
                    // rather than crashing the whole request.
                }
                result = await tool.run(args);
            }
            conversation.push({ role: "tool", tool_call_id: call.id, content: result });
        }
    }

    return "Sorry, I'm having trouble with that request right now — please try again.";
}