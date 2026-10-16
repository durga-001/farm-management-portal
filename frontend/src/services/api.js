const BASE_URL = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export const api = {
  signup: (body) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  getAnimals: (farmId) =>
    request(`/animals${farmId ? `?farmId=${farmId}` : ""}`),
  addAnimal: (body) =>
    request("/animals", { method: "POST", body: JSON.stringify(body) }),
  deleteAnimal: (id) => request(`/animals/${id}`, { method: "DELETE" }),
  setAnimalStatus: (id, status) =>
    request(`/animals/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  addMedicine: (body) =>
    request("/medicine", { method: "POST", body: JSON.stringify(body) }),

  getFarms: () => request("/farms"),
  assignVetToFarm: (farmId, vetId) =>
    request(`/farms/${farmId}/assign-vet`, {
      method: "PATCH",
      body: JSON.stringify({ vetId }),
    }),

  getNotifications: () => request("/notifications"),
  vetSendNotification: (body) =>
    request("/notifications/vet-send", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getRegistrationStats: () => request("/stats/registrations-by-location"),
  getPublicStats: () => request("/stats/public"),

  getVets: () => request("/vets"),
  getMyVet: () => request("/vets/mine"),

  getDataDiagnosis: () => request("/diagnosis/data"),
  getAmuDiagnosis: () => request("/diagnosis/amu"),
  getRiskCompliance: () => request("/diagnosis/risk"),

  askAssistant: (question) =>
    request("/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  getDrugReferences: (q) =>
    request(`/drug-reference${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  addDrugReference: (body) =>
    request("/drug-reference", { method: "POST", body: JSON.stringify(body) }),
  deleteDrugReference: (id) =>
    request(`/drug-reference/${id}`, { method: "DELETE" }),

  getAiAnalysis: () => request("/ai/analysis"),
  submitAiFeedback: (body) =>
    request("/ai/feedback", { method: "POST", body: JSON.stringify(body) }),
  getAiFeedbackStats: () => request("/ai/feedback/stats"),
  aiDraftAnimal: (imageBase64, mediaType) =>
    request("/animals/ai-draft", {
      method: "POST",
      body: JSON.stringify({ imageBase64, mediaType }),
    }),
};
