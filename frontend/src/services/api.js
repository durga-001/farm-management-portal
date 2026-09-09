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
};
