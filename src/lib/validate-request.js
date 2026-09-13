import { NextResponse } from "next/server";

// Parses a request body against a zod schema. Returns { data } on success,
// or { error } — a ready-to-return 400 NextResponse — on failure, so a route
// handler can write:
//   const { data, error } = validateBody(schema, await request.json());
//   if (error) return error;
export function validateBody(schema, body) {
    const result = schema.safeParse(body);
    if (!result.success) {
        const message = result.error.issues[0]?.message || "Invalid request data";
        return { error: NextResponse.json({ error: message }, { status: 400 }) };
    }
    return { data: result.data };
}
