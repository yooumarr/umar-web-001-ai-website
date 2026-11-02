const CORS_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const WINDMILL_URL = Deno.env.get("WINDMILL_WEBHOOK_URL") ?? "";
const WINDMILL_TOKEN = Deno.env.get("WINDMILL_WEBHOOK_TOKEN") ?? "";

const MIN_NAME = 2, MAX_NAME = 80, MAX_EMAIL = 254;
const MIN_MESSAGE = 10, MAX_MESSAGE = 1000;
const MAX_BODY_BYTES = 8_192;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonHeaders(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function fieldErrors(fields: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (typeof fields.name !== "string" || fields.name.trim().length < MIN_NAME || fields.name.trim().length > MAX_NAME) {
    errors.name = "Name must be 2-80 characters.";
  }
  if (typeof fields.email !== "string" || fields.email.length === 0 || fields.email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Please enter a valid email address (max 254 characters).";
  }
  if (typeof fields.message !== "string" || fields.message.trim().length < MIN_MESSAGE || fields.message.trim().length > MAX_MESSAGE) {
    errors.message = "Message must be 10-1000 characters.";
  }
  return errors;
}

async function validate(req: Request): Promise<{ fields?: { [k: string]: string }, errorResp?: Response }> {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return { errorResp: jsonHeaders(413, { error: "Request too large." }) };

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return { errorResp: jsonHeaders(400, { error: "Invalid JSON." }) };
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { errorResp: jsonHeaders(400, { error: "Invalid request." }) };
  }

  // honeypot: must be present-but-empty silently, reject bots explicitly filled
  if (typeof body.website !== "string" || body.website !== "") {
    return { errorResp: jsonHeaders(400, { error: "Validation failed.", fields: { website: "Spam detected." } }) };
  }
  if (typeof body.request_id !== "string" || !UUID_RE.test(body.request_id)) {
    return { errorResp: jsonHeaders(400, { error: "Invalid request_id format." }) };
  }

  const errors = fieldErrors(body);
  if (Object.keys(errors).length > 0) {
    return { errorResp: jsonHeaders(400, { error: "Validation failed.", fields: errors }) };
  }

  return {
    fields: {
      request_id: body.request_id as string,
      name: (body.name as string).trim(),
      email: (body.email as string).trim(),
      message: (body.message as string).trim(),
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonHeaders(405, { error: "Method not allowed." });

  if (!WINDMILL_URL || !WINDMILL_TOKEN) {
    return jsonHeaders(500, { error: "Server misconfiguration." }); // secrets missing
  }

  const { fields, errorResp } = await validate(req);
  if (errorResp) return errorResp;
  if (!fields) return jsonHeaders(400, { error: "Invalid request." });

  let wmResp: Response;
  try {
    wmResp = await fetch(WINDMILL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${WINDMILL_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ payload: {
        request_id: fields.request_id,
        name: fields.name,
        email: fields.email,
        message: fields.message,
      }}),
    });
  } catch {
    return jsonHeaders(502, { error: "We could not process your submission. Please try again later." });
  }

  if (wmResp.status !== 200) {
    return jsonHeaders(502, { error: "We could not store your submission. Please try again later." });
  }

  let wmResult: { stored?: boolean; request_id?: string };
  try {
    wmResult = await wmResp.json();
  } catch {
    return jsonHeaders(502, { error: "We could not confirm your submission. Please try again later." });
  }

  // explicit success check — never infer from HTTP status alone
  if (wmResult.stored === true && wmResult.request_id === fields.request_id) {
    return jsonHeaders(200, { request_id: fields.request_id, status: "received" });
  }
  return jsonHeaders(502, { error: "We could not procure storage confirmation. Please try again later." });
});