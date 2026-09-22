import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_MODEL = "openai/gpt-oss-20b";

const MAX_TURNS = 6;

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