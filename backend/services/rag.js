import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const KB_PATH = new URL("../data/knowledge.json", import.meta.url);
const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "what",
  "are",
  "how",
  "can",
  "does",
  "this",
  "that",
  "from",
  "have",
  "has",
  "was",
  "not",
  "you",
  "your",
  "when",
  "which",
]);

const tokenize = (t) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

let cache = null;
function loadKnowledge() {
  if (!cache) {
    const raw = JSON.parse(fs.readFileSync(KB_PATH, "utf-8"));
    cache = raw.map((d) => ({
      ...d,
      tokens: tokenize(d.title + " " + d.text),
    }));
  }
  return cache;
}

// TF-IDF style keyword retrieval: simple, no extra service needed
export function retrieve(query, k = 4) {
  const docs = loadKnowledge();
  const q = tokenize(query);
  const df = {};
  docs.forEach((d) =>
    new Set(d.tokens).forEach((t) => (df[t] = (df[t] || 0) + 1)),
  );

  return docs
    .map((doc) => {
      let score = 0;
      q.forEach((t) => {
        const tf = doc.tokens.filter((x) => x === t).length;
        if (tf) score += (1 + Math.log(tf)) * Math.log(1 + docs.length / df[t]);
      });
      return { doc, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function askLLM({ question, role, chunks, farmContext }) {
  const client = new Anthropic(); // created here so .env is already loaded

  const context =
    chunks
      .map(
        (c, i) =>
          `[${i + 1}] ${c.doc.title} (source: ${c.doc.source})\n${c.doc.text}`,
      )
      .join("\n\n") || "No matching documents found.";

  const system = `You are a livestock health information assistant inside a farm management portal in India. The user is a ${role}.
Rules:
- Answer ONLY from the CONTEXT and FARM RECORDS given. If they do not cover the question, say you are not sure and advise contacting the veterinarian.
- Never give drug names with doses. Never diagnose with certainty; use words like "may indicate".
- If farm records or vet notes show an animal is under withdrawal or unsafe, say so clearly: its milk or meat should not be used until the vet clears it.
- If signs sound severe (sudden death, bleeding, cannot stand, blisters in many animals), tell them to call a vet immediately.
- Keep it short and in plain language. Mention which source you used.`;

  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 700,
    system,
    messages: [
      {
        role: "user",
        content: `CONTEXT:\n${context}\n\nFARM RECORDS:\n${farmContext || "none"}\n\nQUESTION: ${question}`,
      },
    ],
  });
  return res.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
