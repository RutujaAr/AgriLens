const rawApiUrl = import.meta.env.VITE_API_BASE_URL;

if (import.meta.env.PROD && !rawApiUrl) {
  console.warn(
    "[AgriLens Production Warning] VITE_API_BASE_URL is not configured in your deployment environment variables. Requests may fail if backend is hosted remotely."
  );
}

export const API_BASE = (rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "http://127.0.0.1:8000/api");

export function getAuthToken() {
  return localStorage.getItem("agrilens_token");
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("agrilens_token", token);
  } else {
    localStorage.removeItem("agrilens_token");
  }
}

export function getCurrentUser() {
  const user = localStorage.getItem("agrilens_user");
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("agrilens_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("agrilens_user");
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),
  getMe: () => request("/auth/me"),

  // Datasets
  uploadDataset: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/datasets/upload", {
      method: "POST",
      body: formData,
    });
  },
  loadDemoDataset: () => request("/datasets/demo", { method: "POST" }),
  getMyDatasets: () => request("/datasets/my-datasets"),
  getDataset: (id) => request(`/datasets/${id}`),
  cleanDataset: (id, options) => request(`/datasets/${id}/clean`, { method: "POST", body: options }),

  // Analytics
  getEDA: (id) => request(`/datasets/${id}/eda`),
  getCorrelations: (id) => request(`/datasets/${id}/correlations`),
  getRainfallYield: (id) => request(`/datasets/${id}/rainfall-yield`),
  getStateAnalysis: (id) => request(`/datasets/${id}/state-analysis`),
  getVisualizations: (id) => request(`/datasets/${id}/visualizations`),
  getInsights: (id) => request(`/datasets/${id}/insights`),
  getSummary: (id) => request(`/datasets/${id}/summary`),

  // Sources
  getDataSources: () => request("/data-sources"),
};
