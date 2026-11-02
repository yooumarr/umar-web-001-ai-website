const FUNCTION_URL: string =
  import.meta.env.VITE_CONTACT_FUNCTION_URL || "https://kyfhfmqjggkybpepnnyf.supabase.co/functions/v1/contact-submit";

const REQUEST_BODY_LIMIT = 8_192;

export type ContactPayload = {
  request_id: string;
  name: string;
  email: string;
  message: string;
};

export type SubmitResult =
  | { ok: true; requestId: string }
  | { ok: false; kind: "validation" | "network" | "server"; fieldErrors?: Record<string, string>; message: string };

export function isConfigured(): boolean {
  return FUNCTION_URL.length > 0;
}

export async function submitContact(payload: ContactPayload): Promise<SubmitResult> {
  if (!isConfigured()) {
    return { ok: false, kind: "server", message: "Submission endpoint is not configured." };
  }

  let response: Response;
  try {
    response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, website: "" }),
    });
  } catch {
    return { ok: false, kind: "network", message: "Network problem — please try again." };
  }

  if (response.status === 200) {
    const data = await response.json().catch(() => null);
    if (data?.status === "received" && data?.request_id === payload.request_id) {
      return { ok: true, requestId: payload.request_id };
    }
    return { ok: false, kind: "server", message: "We could not confirm your submission. Please try again." };
  }

  if (response.status >= 400 && response.status < 500) {
    const data = await response.json().catch(() => null);
    const fieldErrors = (data?.fields ?? {}) as Record<string, string>;
    const fallback = response.status === 413 ? "Your message is too large." : "Please check the highlighted fields.";
    return { ok: false, kind: "validation", fieldErrors, message: (typeof data?.error === "string" ? data.error : fallback) || fallback };
  }
  return { ok: false, kind: "server", message: "We could not store your submission. Please try again later." };
}

export { REQUEST_BODY_LIMIT };
