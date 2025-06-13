// synthetivolve/frontend/js/dashboard.js
import { api } from "./api.js";
import { ui } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Synthetivolve Dashboard Initialized.");

  // --- STATE ---
  // We manage state more explicitly now
  let state = {
    currentGoal: null,
    todayNutrition: null,
    weeklyAdherence: [],
    weightSummary: null,
  };

  // --- DATA LOADING ---
  async function loadDashboardData() {
    ui.setLoadingState(true);
    try {
      // Fetch goal first as it's needed by other components
      state.currentGoal = await api.fetchCurrentGoal();
      ui.renderGoal(state.currentGoal);

      // Fetch remaining data in parallel
      const [nutrition, weight, adherence] = await Promise.all([
        api.fetchTodayNutrition(),
        api.fetchWeightData(),
        api.fetchWeeklyAdherence(),
      ]);

      // Update state
      state.todayNutrition = nutrition;
      state.weightSummary = weight;
      state.weeklyAdherence = adherence;

      // Render components with the new state
      ui.renderTodayProgress(state.todayNutrition, state.currentGoal);
      ui.renderWeightData(state.weightSummary, state.currentGoal);
      ui.drawAdherenceChart(state.weeklyAdherence);
    } catch (error) {
      ui.showError(`Failed to load dashboard: ${error.message}`);
    } finally {
      ui.setLoadingState(false);
    }
  }

  // --- EVENT HANDLERS ---
  async function handleWeightSubmission() {
    const weight = parseFloat(ui.elements.weightInput.value);
    if (!weight || weight < 50 || weight > 500) {
      ui.showError("Please enter a valid weight between 50 and 500 lbs");
      return;
    }

    ui.elements.logWeightBtn.disabled = true;
    ui.elements.logWeightBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i>';

    try {
      await api.logWeight(weight);
      ui.elements.weightInput.value = "";

      // Refresh weight data after logging
      state.weightSummary = await api.fetchWeightData();
      ui.renderWeightData(state.weightSummary, state.currentGoal);
    } catch (error) {
      ui.showError(`Failed to log weight: ${error.message}`);
    } finally {
      ui.elements.logWeightBtn.disabled = false;
      ui.elements.logWeightBtn.innerHTML = '<i class="fas fa-plus"></i> Log';
    }
  }

  // --- EVENT LISTENERS ---
  ui.elements.updateGoalBtn.addEventListener("click", () => {
    window.location.href = "calculator.html";
  });

  ui.elements.logWeightBtn.addEventListener("click", handleWeightSubmission);
  ui.elements.weightInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleWeightSubmission();
  });

  // --- INITIALIZATION ---
  loadDashboardData();

  // Optional: Set up auto-refresh intervals that call the specific load functions
  // setInterval(loadNutrition, 2 * 60 * 1000);
});
