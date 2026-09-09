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
  sendNotification: (body) =>
    request("/notifications", { method: "POST", body: JSON.stringify(body) }),
  vetSendNotification: (body) =>
    request("/notifications/vet-send", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getRegistrationStats: () => request("/stats/registrations-by-location"),
  getPublicStats: () => request("/stats/public"),

  createVet: (body) =>
    request("/vets", { method: "POST", body: JSON.stringify(body) }),
  getVets: () => request("/vets"),
  getMyVet: () => request("/vets/mine"),

  getDataDiagnosis: () => request("/diagnosis/data"),
  getAmuDiagnosis: () => request("/diagnosis/amu"),
  getRiskCompliance: () => request("/diagnosis/risk"),
};
