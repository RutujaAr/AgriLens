const rawApiUrl = import.meta.env.VITE_API_BASE_URL;

let resolvedApiBase;
if (rawApiUrl && rawApiUrl.trim()) {
  const cleanUrl = rawApiUrl.trim().replace(/\/+$/, "");
  resolvedApiBase = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
} else if (import.meta.env.PROD) {
  resolvedApiBase = "https://agrilens-api-eeoq.onrender.com/api";
} else {
  resolvedApiBase = "http://127.0.0.1:8000/api";
}

export const API_BASE = resolvedApiBase;

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

  const timeoutMs = options.timeout || 45000;
  const maxRetries = options.retries || 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === "AbortError";
      const isNetwork = err.message === "Failed to fetch" || err.message.includes("NetworkError");

      if (attempt < maxRetries && (isAbort || isNetwork)) {
        console.warn(`[AgriLens API] Request to ${endpoint} failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in 2.5s...`);
        await new Promise((resolve) => setTimeout(resolve, 2500));
        continue;
      }

      if (isAbort) {
        throw new Error(
          "Request timed out. The cloud server may be waking up from sleep. Please try again in a few moments."
        );
      }
      if (isNetwork) {
        throw new Error(
          "Unable to reach the AgriLens server. Please check your internet connection or verify the backend is online."
        );
      }
      throw err;
    }
  }
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
  loadDemoDataset: () => request("/datasets/demo", { method: "POST", timeout: 60000, retries: 1 }),
  getMyDatasets: () => request("/datasets/my-datasets"),
  getDataset: (id) => request(`/datasets/${id}`),
  cleanDataset: (id, options) => request(`/datasets/${id}/clean`, { method: "POST", body: options }),

  // Analytics
  getEDA: (id) => request(`/datasets/${id}/eda`),
  getCorrelations: (id) => request(`/datasets/${id}/correlations`),
  getStateAnalysis: (id) => request(`/datasets/${id}/state-analysis`),
  getVisualizations: (id) => request(`/datasets/${id}/visualizations`),
  getInsights: (id) => request(`/datasets/${id}/insights`),
  getSummary: (id) => request(`/datasets/${id}/summary`),

  // Sources
  getDataSources: () => request("/data-sources"),
};
