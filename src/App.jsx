import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  QrCode,
  MessageSquare,
  Mic,
  Camera,
  AlertTriangle,
  ChevronLeft,
  Plus,
  Send,
  Volume2,
  Sparkles,
  Syringe,
  X,
} from "lucide-react";

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Inter:wght@400;500;600&display=swap');";

const COLORS = {
  bg: "#1B2A1E",
  panel: "#22331F",
  panelLight: "#28391F",
  wheat: "#D9A62E",
  wheatDark: "#8A6C1F",
  sage: "#8FA37E",
  sageDark: "#5C6E52",
  rust: "#C1502F",
  rustBg: "#3B241B",
  parchment: "#F1ECDD",
  muted: "#AEB99E",
  border: "#3A4A38",
};

const SPECIES = ["Cow", "Buffalo", "Goat", "Sheep", "Poultry"];
const DRUGS = [
  "Oxytetracycline",
  "Amoxicillin",
  "Enrofloxacin",
  "Ceftiofur",
  "Sulfadiazine",
];

function seedAnimals() {
  const names = [
    "Ganga",
    "Kaveri",
    "Moti",
    "Laxmi",
    "Bijli",
    "Chandni",
    "Raja",
    "Shyama",
    "Gauri",
    "Ballu",
  ];
  return names.map((name, i) => {
    const species = SPECIES[i % SPECIES.length];
    const treatCount = [1, 5, 2, 7, 1, 3, 6, 2, 1, 4][i];
    const daysSince = [40, 3, 20, 1, 55, 12, 2, 30, 60, 8][i];
    const score = computeScoreRaw(treatCount, daysSince);
    return {
      id: "AN-" + String(1000 + i),
      name,
      species,
      farm: "Shivpuri Farm, Sector 4",
      treatCount,
      daysSinceLast: daysSince,
      lastDrug: DRUGS[i % DRUGS.length],
      hasImage: [
        false,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        false,
      ][i],
      score,
    };
  });
}

function computeScoreRaw(treatCount, daysSinceLast) {
  let score = treatCount * 9;
  if (daysSinceLast < 7) score += 18;
  if (daysSinceLast < 3) score += 12;
  score = Math.max(4, Math.min(96, score + (treatCount > 4 ? 10 : 0)));
  return Math.round(score);
}

function riskBucket(score) {
  if (score >= 65) return { label: "High risk", color: COLORS.rust };
  if (score >= 35) return { label: "Medium risk", color: COLORS.wheat };
  return { label: "Low risk", color: COLORS.sage };
}

function riskReason(animal) {
  if (animal.daysSinceLast < 3 && animal.treatCount > 3) {
    return `Treated ${animal.treatCount} times with ${animal.daysSinceLast === 0 ? "another dose today" : animal.daysSinceLast + " day gap"} — frequency is above this animal's normal pattern.`;
  }
  if (animal.treatCount > 5) {
    return `${animal.treatCount} antimicrobial treatments on record is high relative to farm average — flagged for review.`;
  }
  if (animal.daysSinceLast < 5) {
    return `Last dose (${animal.lastDrug}) was only ${animal.daysSinceLast} day${animal.daysSinceLast === 1 ? "" : "s"} ago — within typical withdrawal window.`;
  }
  return `Usage pattern is within normal range for this animal.`;
}

async function askClaude(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const text = (data.content || []).map((b) => b.text || "").join("\n");
  return text || "No response.";
}

function Sidebar({ view, setView }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "risk", label: "Higher risk", icon: AlertTriangle },
    { id: "chat", label: "Chat assistant", icon: MessageSquare },
  ];
  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        background: COLORS.panel,
        borderRight: `1px solid ${COLORS.border}`,
        padding: "24px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: "Fraunces, serif",
          fontSize: 19,
          color: COLORS.parchment,
          padding: "0 12px 20px",
          lineHeight: 1.25,
        }}
      >
        Farm Ledger
      </div>
      {items.map((it) => {
        const Icon = it.icon;
        const active = view === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setView(it.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              background: active ? COLORS.panelLight : "transparent",
              border: "none",
              cursor: "pointer",
              color: active ? COLORS.wheat : COLORS.muted,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "left",
            }}
          >
            <Icon size={16} /> {it.label}
          </button>
        );
      })}
      <div
        style={{
          marginTop: "auto",
          padding: "12px",
          fontSize: 11,
          color: COLORS.sageDark,
          fontFamily: "Inter, sans-serif",
          lineHeight: 1.5,
        }}
      >
        Prototype build. Risk scores are rule-based placeholders for the ML
        model.
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: "14px 16px",
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: COLORS.muted,
          fontFamily: "Inter, sans-serif",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontFamily: "Fraunces, serif",
          color: accent || COLORS.parchment,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function AnimalRow({ animal, onClick }) {
  const bucket = riskBucket(animal.score);
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderLeft: `3px solid ${bucket.color}`,
        background: COLORS.panel,
        marginBottom: 6,
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: COLORS.panelLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Fraunces, serif",
          color: COLORS.wheat,
          fontSize: 14,
        }}
      >
        {animal.name[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            color: COLORS.parchment,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {animal.name} · {animal.species}
        </div>
        <div
          style={{
            color: COLORS.muted,
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {animal.id} · {animal.treatCount} treatments · last{" "}
          {animal.daysSinceLast}d ago
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            color: bucket.color,
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {bucket.label}
        </div>
        <div style={{ color: COLORS.muted, fontSize: 11 }}>
          score {animal.score}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ animals, setSelected, setView }) {
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const highRisk = animals.filter((a) => a.score >= 65).length;
  const treatedThisWeek = animals.filter((a) => a.daysSinceLast <= 7).length;

  const runSummary = async () => {
    setLoadingSummary(true);
    setSummary("");
    const dataText = animals
      .map(
        (a) =>
          `${a.name} (${a.species}): ${a.treatCount} treatments, last ${a.lastDrug} ${a.daysSinceLast}d ago, risk score ${a.score}`,
      )
      .join("; ");
    const prompt = `You are summarizing a livestock farm's antimicrobial usage records for a farmer. Data: ${dataText}. Write a short 3-4 sentence plain-language summary highlighting any animals or patterns that need attention. No markdown headers, just prose.`;
    try {
      const text = await askClaude(prompt);
      setSummary(text);
    } catch (e) {
      setSummary("Could not reach the AI service right now.");
    }
    setLoadingSummary(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 24,
              color: COLORS.parchment,
            }}
          >
            Shivpuri Farm
          </div>
          <div
            style={{
              color: COLORS.muted,
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
              marginTop: 2,
            }}
          >
            Antimicrobial usage overview
          </div>
        </div>
        <button
          onClick={runSummary}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: COLORS.wheat,
            color: "#2B2107",
            border: "none",
            borderRadius: 8,
            padding: "9px 14px",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Sparkles size={15} />{" "}
          {loadingSummary ? "Summarizing…" : "AI summarize reports"}
        </button>
      </div>

      {summary && (
        <div
          style={{
            background: COLORS.panelLight,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            color: COLORS.parchment,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {summary}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total animals" value={animals.length} />
        <StatCard label="High risk" value={highRisk} accent={COLORS.rust} />
        <StatCard
          label="Treated this week"
          value={treatedThisWeek}
          accent={COLORS.wheat}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            color: COLORS.parchment,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Animals
        </div>
        <button
          onClick={() => setView("risk")}
          style={{
            background: "transparent",
            border: "none",
            color: COLORS.sage,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          View higher risk →
        </button>
      </div>
      {animals.map((a) => (
        <AnimalRow key={a.id} animal={a} onClick={() => setSelected(a.id)} />
      ))}
    </div>
  );
}

function RiskView({ animals, setSelected }) {
  const sorted = [...animals]
    .sort((a, b) => b.score - a.score)
    .filter((a) => a.score >= 35);
  return (
    <div>
      <div
        style={{
          fontFamily: "Fraunces, serif",
          fontSize: 22,
          color: COLORS.parchment,
          marginBottom: 4,
        }}
      >
        Animals at higher risk
      </div>
      <div
        style={{
          color: COLORS.muted,
          fontSize: 13,
          fontFamily: "Inter, sans-serif",
          marginBottom: 18,
        }}
      >
        Sorted by AMU risk score, medium and above
      </div>
      {sorted.length === 0 && (
        <div style={{ color: COLORS.muted, fontFamily: "Inter, sans-serif" }}>
          No animals currently flagged.
        </div>
      )}
      {sorted.map((a) => (
        <div
          key={a.id}
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderLeft: `3px solid ${riskBucket(a.score).color}`,
            borderRadius: 8,
            padding: 14,
            marginBottom: 8,
            cursor: "pointer",
          }}
          onClick={() => setSelected(a.id)}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div
              style={{
                color: COLORS.parchment,
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {a.name} · {a.id}
            </div>
            <div
              style={{
                color: riskBucket(a.score).color,
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {riskBucket(a.score).label}
            </div>
          </div>
          <div
            style={{
              color: COLORS.muted,
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            {riskReason(a)}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnimalProfile({ animal, onBack, onUpdate }) {
  const [imgPreview, setImgPreview] = useState(null);
  const [scoring, setScoring] = useState(false);
  const fileRef = useRef(null);
  const bucket = riskBucket(animal.score);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(animal.id)}`;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgPreview(url);
    setScoring(true);
    setTimeout(() => {
      const bump = 10 + (file.size % 20);
      const newScore = Math.min(97, animal.score + bump);
      onUpdate({ ...animal, hasImage: true, score: newScore });
      setScoring(false);
    }, 900);
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          color: COLORS.sage,
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        <ChevronLeft size={15} /> Back
      </button>
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            <img
              src={qrUrl}
              alt={"QR code for " + animal.id}
              style={{ width: 120, height: 120, borderRadius: 6 }}
            />
            <div
              style={{
                color: COLORS.muted,
                fontSize: 11,
                fontFamily: "Inter, sans-serif",
                marginTop: 8,
              }}
            >
              {animal.id}
            </div>
          </div>
          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                color: COLORS.parchment,
                fontFamily: "Fraunces, serif",
                fontSize: 18,
                marginBottom: 2,
              }}
            >
              {animal.name}
            </div>
            <div
              style={{
                color: COLORS.muted,
                fontSize: 12,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {animal.species} · {animal.farm}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${bucket.color}55`,
              borderRadius: 10,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  color: COLORS.muted,
                  fontSize: 12,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                AMU risk score
              </div>
              <div
                style={{
                  color: bucket.color,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {bucket.label}
              </div>
            </div>
            <div
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 30,
                color: COLORS.parchment,
                margin: "4px 0",
              }}
            >
              {animal.score}
              <span style={{ fontSize: 14, color: COLORS.muted }}> / 100</span>
            </div>
            <div
              style={{
                color: COLORS.parchment,
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                lineHeight: 1.6,
                opacity: 0.9,
              }}
            >
              {riskReason(animal)}
            </div>
          </div>

          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Camera size={15} color={COLORS.wheat} />
              <div
                style={{
                  color: COLORS.parchment,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Wound / infection photo
              </div>
            </div>
            {imgPreview ? (
              <img
                src={imgPreview}
                alt="Uploaded wound"
                style={{ width: 140, borderRadius: 8, marginBottom: 8 }}
              />
            ) : (
              <div
                style={{
                  color: COLORS.muted,
                  fontSize: 12,
                  fontFamily: "Inter, sans-serif",
                  marginBottom: 8,
                }}
              >
                No image uploaded yet.
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileRef.current.click()}
              style={{
                background: COLORS.panelLight,
                color: COLORS.parchment,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "7px 12px",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {scoring ? "Analyzing…" : "Upload photo"}
            </button>
            <div
              style={{
                color: COLORS.sageDark,
                fontSize: 11,
                fontFamily: "Inter, sans-serif",
                marginTop: 8,
              }}
            >
              V1 heuristic: image presence and file signal feed into the score
              above. Production version replaces this with a trained CV +
              tabular model.
            </div>
          </div>

          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Syringe size={15} color={COLORS.sage} />
              <div
                style={{
                  color: COLORS.parchment,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Treatment history
              </div>
            </div>
            <div
              style={{
                color: COLORS.muted,
                fontSize: 12,
                fontFamily: "Inter, sans-serif",
                lineHeight: 2,
              }}
            >
              {animal.treatCount} treatment{animal.treatCount === 1 ? "" : "s"}{" "}
              on record · most recent: {animal.lastDrug}, {animal.daysSinceLast}{" "}
              day{animal.daysSinceLast === 1 ? "" : "s"} ago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatAssistant({ animals }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: 'Ask me about any animal\'s treatment history, or say something like "which animals need review".',
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Voice input isn't supported in this browser. Type your question instead.",
        },
      ]);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    const dataText = animals
      .map(
        (a) =>
          `${a.name} (${a.id}, ${a.species}): score ${a.score}, ${a.treatCount} treatments, last ${a.lastDrug} ${a.daysSinceLast}d ago`,
      )
      .join("; ");
    const prompt = `You are a farm assistant helping a farmer understand livestock antimicrobial records. Farm data: ${dataText}. Farmer's question: "${q}". Answer in 2-4 short sentences, plain language, no markdown.`;
    try {
      const reply = await askClaude(prompt);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Couldn't reach the AI service just now." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div>
      <div
        style={{
          fontFamily: "Fraunces, serif",
          fontSize: 22,
          color: COLORS.parchment,
          marginBottom: 4,
        }}
      >
        Chat assistant
      </div>
      <div
        style={{
          color: COLORS.muted,
          fontSize: 13,
          fontFamily: "Inter, sans-serif",
          marginBottom: 16,
        }}
      >
        Voice or text — ask about any animal or usage pattern
      </div>
      <div
        ref={scrollRef}
        style={{
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: 16,
          height: 340,
          overflowY: "auto",
          marginBottom: 12,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "9px 13px",
                borderRadius: 10,
                fontFamily: "Inter, sans-serif",
                fontSize: 13.5,
                lineHeight: 1.5,
                background:
                  m.role === "user" ? COLORS.wheat : COLORS.panelLight,
                color: m.role === "user" ? "#2B2107" : COLORS.parchment,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div
            style={{
              color: COLORS.muted,
              fontSize: 12,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Thinking…
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={startVoice}
          style={{
            background: listening ? COLORS.rust : COLORS.panelLight,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Voice input"
        >
          <Mic size={16} color={listening ? "#fff" : COLORS.wheat} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type or use the mic…"
          style={{
            flex: 1,
            background: COLORS.panelLight,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: "0 14px",
            color: COLORS.parchment,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
          }}
        />
        <button
          onClick={() => send()}
          style={{
            background: COLORS.wheat,
            border: "none",
            borderRadius: 8,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Send"
        >
          <Send size={16} color="#2B2107" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [animals, setAnimals] = useState(seedAnimals());
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);

  const updateAnimal = (updated) => {
    setAnimals((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const selected = animals.find((a) => a.id === selectedId);

  return (
    <div
      style={{
        display: "flex",
        minHeight: 600,
        background: COLORS.bg,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{FONT_IMPORT}</style>
      <Sidebar
        view={view}
        setView={(v) => {
          setView(v);
          setSelectedId(null);
        }}
      />
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        {selected ? (
          <AnimalProfile
            animal={selected}
            onBack={() => setSelectedId(null)}
            onUpdate={updateAnimal}
          />
        ) : view === "dashboard" ? (
          <Dashboard
            animals={animals}
            setSelected={setSelectedId}
            setView={setView}
          />
        ) : view === "risk" ? (
          <RiskView animals={animals} setSelected={setSelectedId} />
        ) : (
          <ChatAssistant animals={animals} />
        )}
      </div>
    </div>
  );
}
