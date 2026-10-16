// Thin client for the FastAPI AI service. Reads the URL lazily so dotenv has loaded.
export class AiServiceError extends Error {
  constructor(message) {
    super(message);
    this.status = 503;
  }
}

export async function analyzeBatch(payload, timeoutMs = 20000) {
  const base = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok)
      throw new AiServiceError(`AI service returned HTTP ${res.status}.`);
    return await res.json();
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    throw new AiServiceError(
      `AI service is unreachable at ${base}. Start it with: uvicorn app.main:app --port 8000`,
    );
  } finally {
    clearTimeout(timer);
  }
}
