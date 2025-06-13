// synthetivolve/frontend/js/api.js

const API_BASE_URL = "http://127.0.0.1:8000/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `API Error: ${response.status} ${response.statusText} - ${
        errorData.detail || "No details"
      }`
    );
  }
  // Handle 204 No Content response
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  fetchCurrentGoal: () => request("/goals/current"),
  fetchWeightData: () => request("/weight/data"),
  fetchTodayNutrition: () => request("/nutrition/today"),
  fetchWeeklyAdherence: () => request("/nutrition/weekly-adherence"),
  logWeight: (weight) =>
    request("/weight/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
    }),
};
