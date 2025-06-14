// synthetivolve/frontend/js/dashboard.js (DEBUGGING VERSION)
console.log("🔄 [RELOAD CHECK] dashboard.js loaded at:", new Date().toISOString());

import { api } from "./api.js";
import { ui } from "./ui.js";

window.addEventListener('beforeunload', (event) => {
    console.error("⚠️ [RELOAD] Page is reloading/unloading!");
    console.trace("Reload stack trace:");
});

// Wait for all external libraries to load
function waitForLibraries() {
    return new Promise((resolve) => {
        const checkLibraries = () => {
            if (
                typeof Chart !== 'undefined' &&
                typeof dateFns !== 'undefined' &&
                typeof supabase !== 'undefined'
            ) {
                console.log("✅ All libraries loaded successfully");
                resolve();
            } else {
                console.log("⏳ Waiting for libraries...", {
                    chart: typeof Chart !== 'undefined',
                    dateFns: typeof dateFns !== 'undefined',
                    supabase: typeof supabase !== 'undefined'
                });
                setTimeout(checkLibraries, 50);
            }
        };
        checkLibraries();
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  await waitForLibraries();
  console.log("🎉 All libraries loaded. Initializing dashboard...");

  // --- STATE ---
  let state = {
    currentGoal: null,
    todayNutrition: null,
    weeklyAdherence: [],
    weightSummary: null,
  };

  // --- DATA LOADING ---
  async function loadDashboardData() {
    console.group("🚀 [ACTION] loadDashboardData");
    console.log("🔄 [RELOAD CHECK] loadDashboardData called at:", new Date().toISOString());

    // Add recursion check
    if (window._loadingData) {
        console.error("⚠️ [ERROR] loadDashboardData called while already loading!");
        return;
    }
    window._loadingData = true;

    ui.setLoadingState(true);
    try {
      console.log("  - Fetching current goal...");
      state.currentGoal = await api.fetchCurrentGoal();
      console.log("  - ✅ Goal data received:", state.currentGoal);
      ui.renderGoal(state.currentGoal);

      console.log("  - Fetching remaining data in parallel...");
      const [nutrition, weight, adherence] = await Promise.all([
        api.fetchTodayNutrition(),
        api.fetchWeightData(),
        api.fetchWeeklyAdherence(),
      ]);

      console.log("  - ✅ Today Nutrition received:", nutrition);
      console.log("  - ✅ Weight Data received:", weight);
      console.log("  - ✅ Adherence Data received:", adherence);

      // Update state
      state.todayNutrition = nutrition;
      state.weightSummary = weight;
      state.weeklyAdherence = adherence;

      // Render components with the new state
      console.log("  - Rendering all components with new state...");
      ui.renderTodayProgress(state.todayNutrition, state.currentGoal);
      ui.renderWeightData(state.weightSummary, state.currentGoal);
      ui.drawAdherenceChart(state.weeklyAdherence);
    } catch (error) {
      ui.showError(`[ERROR] Failed to load dashboard: ${error.message}`);
    } finally {
      ui.setLoadingState(false);
      window._loadingData = false; // Reset loading state
      console.groupEnd();
    }
  }

  // --- EVENT HANDLERS ---
  async function handleWeightSubmission() {
    console.group("🚀 [ACTION] handleWeightSubmission");
    const weight = parseFloat(ui.elements.weightInput.value);
    if (!weight || weight < 50 || weight > 500) {
      ui.showError("Please enter a valid weight between 50 and 500 lbs");
      console.warn("  - Invalid weight input. Aborting.");
      console.groupEnd();
      return;
    }

    ui.elements.logWeightBtn.disabled = true;
    ui.elements.logWeightBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i>';

    try {
      console.log(`  - Logging weight: ${weight}`);
      await api.logWeight(weight);
      console.log("  - ✅ Weight logged successfully.");
      ui.elements.weightInput.value = "";

      // Refresh weight data after logging
      console.log("  - Refreshing weight data...");
      state.weightSummary = await api.fetchWeightData();
      console.log("  - ✅ Refreshed weight data received:", state.weightSummary);
      ui.renderWeightData(state.weightSummary, state.currentGoal);
    } catch (error) {
      ui.showError(`[ERROR] Failed to log weight: ${error.message}`);
    } finally {
      ui.elements.logWeightBtn.disabled = false;
      ui.elements.logWeightBtn.innerHTML = '<i class="fas fa-plus"></i> Log';
      console.groupEnd();
    }
  }

  // --- EVENT LISTENERS ---
  console.log("🎧 Attaching event listeners...");
  ui.elements.updateGoalBtn.addEventListener("click", () => {
    console.log("  - 'Update Goal' clicked. Navigating...");
    window.location.href = "calculator.html";
  });

  ui.elements.logWeightBtn.addEventListener("click", handleWeightSubmission);

  ui.elements.weightInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      console.log("  - 'Enter' key pressed in weight input.");
      e.preventDefault(); // THE FIX
      handleWeightSubmission();
    }
  });
  console.log("  - ✅ Event listeners attached.");

  // --- INITIALIZATION ---
  loadDashboardData();
});