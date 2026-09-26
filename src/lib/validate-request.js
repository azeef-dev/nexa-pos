import { NextResponse } from "next/server";

export function validateBody(schema, body) {
    const result = schema.safeParse(body);
    if (!result.success) {
        const message = result.error.issues[0]?.message || "Invalid request data";
        return { error: NextResponse.json({ error: message }, { status: 400 }) };
    }
    return { data: result.data };
}
