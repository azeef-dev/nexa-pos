// Tools for the provider business-assistant chat (src/app/api/chat/route.js).
// Every tool closes over `providerId` from the authenticated session — the
// model is never given a providerId parameter, so it cannot be talked into
// (or tricked via prompt injection into) querying another business's data.

export function buildTools(providerId) {
    return [];
}
