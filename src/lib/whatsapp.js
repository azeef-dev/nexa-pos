// Thin wrapper around Meta's WhatsApp Cloud API. One access token for the
// whole NexaPOS platform (a System User token from your Meta app), while
// each Provider connects their own registered number via
// Provider.whatsappPhoneNumberId — that's what lets a single webhook route
// messages to the right business.

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

function graphUrl(phoneNumberId) {
    return `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
}

async function callGraphApi(phoneNumberId, body) {
    if (!ACCESS_TOKEN) {
        throw new Error("WHATSAPP_ACCESS_TOKEN is not configured");
    }
    if (!phoneNumberId) {
        throw new Error("This business hasn't connected a WhatsApp number yet");
    }

    const res = await fetch(graphUrl(phoneNumberId), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data?.error?.message || `WhatsApp API error (${res.status})`);
    }

    return data;
}

// Meta wants digits only — no "+", spaces, or leading zeros (E.164 without the plus).
export function normalizePhone(phone) {
    return String(phone).replace(/\D/g, "");
}

// Free-form text. Only deliverable inside WhatsApp's 24-hour customer service
// window (i.e. the customer messaged you within the last 24h) — that's a
// platform rule, not something this code enforces. Use sendWhatsAppTemplate
// for anything business-initiated outside that window.
export async function sendWhatsAppText(phoneNumberId, to, body) {
    return callGraphApi(phoneNumberId, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizePhone(to),
        type: "text",
        text: { body },
    });
}

// Pre-approved template message (create + get these approved in Meta Business
// Manager first). `params` fills the template's {{1}}, {{2}}... in order.
export async function sendWhatsAppTemplate(phoneNumberId, to, templateName, params = [], { languageCode = "en_US", category } = {}) {
    const body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizePhone(to),
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
            components: params.length
                ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text: String(text) })) }]
                : [],
        },
    };

    // "utility" / "authentication" / "marketing" — set this to match how the
    // template was categorized when you created it, so it's billed correctly.
    if (category) body.category = category;

    return callGraphApi(phoneNumberId, body);
}

// GET /api/webhooks/whatsapp verification handshake, called once by Meta
// when you save the webhook URL in the App Dashboard.
export function verifyWebhookChallenge(searchParams) {
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return challenge;
    }
    return null;
}