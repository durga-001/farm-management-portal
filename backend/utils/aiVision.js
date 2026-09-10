const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANIMAL_VISION_MODEL || "claude-sonnet-4-6";

export async function draftAnimalFromImage({ imageBase64, mediaType }) {
  if (!ANTHROPIC_API_KEY) {
    return {
      available: false,
      message:
        "AI-assisted registration is not configured on this server. Please enter the animal's details manually.",
    };
  }
  if (!imageBase64 || !mediaType) {
    return { available: false, message: "No image provided." };
  }

  const prompt = [
    "You are assisting a farmer registering livestock in a farm record system.",
    "Look at the photo and suggest ONLY: the most likely animal type",
    "(one of: Cow, Buffalo, Goat, Sheep, Poultry), a rough breed guess if visibly",
    "identifiable, and a confidence score from 0-100 for your own guess.",
    "If you are not reasonably confident, say so plainly instead of guessing.",
    "Do NOT suggest any medical, dosage, withdrawal, or health information.",
    "Respond ONLY as JSON: ",
    '{"type": string|null, "breedGuess": string|null, "confidence": number, "notes": string}',
  ].join(" ");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        available: false,
        message:
          "AI-assisted registration is temporarily unavailable. Please enter the animal's details manually.",
      };
    }

    const data = await response.json();
    const text = (data.content || [])
      .map((b) => b.text || "")
      .join("")
      .trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        available: false,
        message: "Could not analyze the photo. Please enter details manually.",
      };
    }
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      available: true,
      suggestion: {
        type: parsed.type || null,
        breedGuess: parsed.breedGuess || null,
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : null,
        notes: parsed.notes || "",
      },
      disclaimer:
        "AI suggestion only — review and correct every field before saving. This does not replace veterinary identification.",
    };
  } catch (e) {
    return {
      available: false,
      message:
        "AI-assisted registration failed. Please enter the animal's details manually.",
    };
  }
}
