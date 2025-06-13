// synthetivolve/frontend/js/ui.js
import { calculateDaysRemaining, calculateGoalProgress } from "./utils.js";

// A single object to hold all DOM element references
const elements = {
  noGoalState: document.getElementById("no-goal-state"),
  activeGoalState: document.getElementById("active-goal-state"),
  goalName: document.getElementById("goal-name"),
  daysRemaining: document.getElementById("days-remaining"),
  goalProgressFill: document.getElementById("goal-progress-fill"),
  targetCalories: document.getElementById("target-calories"),
  targetProtein: document.getElementById("target-protein"),
  targetCarbs: document.getElementById("target-carbs"),
  targetFat: document.getElementById("target-fat"),
  caloriesProgress: document.getElementById("calories-progress"),
  proteinProgress: document.getElementById("protein-progress"),
  carbsProgress: document.getElementById("carbs-progress"),
  fatProgress: document.getElementById("fat-progress"),
  caloriesProgressBar: document.getElementById("calories-progress-bar"),
  proteinProgressBar: document.getElementById("protein-progress-bar"),
  carbsProgressBar: document.getElementById("carbs-progress-bar"),
  fatProgressBar: document.getElementById("fat-progress-bar"),
  currentWeightDisplay: document.getElementById("current-weight-display"),
  sevenDayAverage: document.getElementById("seven-day-average"),
  weekChange: document.getElementById("week-change"),
  goalProgressWeight: document.getElementById("goal-progress-weight"),
  weightInput: document.getElementById("weight-input"),
  logWeightBtn: document.getElementById("log-weight-btn"),
  weightTrendCtx: document
    .getElementById("weight-trend-chart")
    .getContext("2d"),
  adherenceCtx: document.getElementById("adherence-canvas").getContext("2d"),
  updateGoalBtn: document.getElementById("update-goal-btn"),
};

let weightChartInstance = null;
let adherenceChartInstance = null;

function updateProgressBar(element, current, target) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  element.style.width = `${percentage}%`;
  if (percentage >= 90) element.style.backgroundColor = "#00f2ea";
  else if (percentage >= 75) element.style.backgroundColor = "#4CAF50";
  else if (percentage >= 50) element.style.backgroundColor = "#FF9800";
  else element.style.backgroundColor = "#F44336";
}

export const ui = {
  elements, // Expose elements for event listeners in dashboard.js

  renderGoal(goal) {
    if (!goal) {
      elements.noGoalState.classList.remove("hidden");
      elements.activeGoalState.classList.add("hidden");
      return;
    }
    elements.noGoalState.classList.add("hidden");
    elements.activeGoalState.classList.remove("hidden");

    elements.goalName.textContent = goal.goal_name;
    elements.targetCalories.textContent = goal.target_calories;
    elements.targetProtein.textContent = `${goal.target_protein_g}g`;
    elements.targetCarbs.textContent = `${goal.target_carbs_g}g`;
    elements.targetFat.textContent = `${goal.target_fat_g}g`;

    const daysLeft = calculateDaysRemaining(goal.end_date);
    elements.daysRemaining.textContent =
      daysLeft > 0 ? `${daysLeft} days remaining` : "Goal completed!";

    const progress = calculateGoalProgress(goal.start_date, goal.end_date);
    elements.goalProgressFill.style.width = `${progress}%`;
  },

  renderTodayProgress(nutrition, goal) {
    if (!nutrition || !goal) return;
    elements.caloriesProgress.textContent = `${Math.round(
      nutrition.calories
    )} / ${goal.target_calories} kcal`;
    elements.proteinProgress.textContent = `${Math.round(
      nutrition.protein
    )} / ${goal.target_protein_g}g`;
    elements.carbsProgress.textContent = `${Math.round(nutrition.carbs)} / ${
      goal.target_carbs_g
    }g`;
    elements.fatProgress.textContent = `${Math.round(nutrition.fat)} / ${
      goal.target_fat_g
    }g`;

    updateProgressBar(
      elements.caloriesProgressBar,
      nutrition.calories,
      goal.target_calories
    );
    updateProgressBar(
      elements.proteinProgressBar,
      nutrition.protein,
      goal.target_protein_g
    );
    updateProgressBar(
      elements.carbsProgressBar,
      nutrition.carbs,
      goal.target_carbs_g
    );
    updateProgressBar(
      elements.fatProgressBar,
      nutrition.fat,
      goal.target_fat_g
    );
  },

  renderWeightData(weightSummary, goal) {
    const { current_weight, seven_day_average, weight_data } = weightSummary;

    elements.currentWeightDisplay.textContent = current_weight
      ? `${current_weight.toFixed(1)} lbs`
      : "--.- lbs";
    elements.sevenDayAverage.textContent = seven_day_average
      ? `${seven_day_average.toFixed(1)} lbs`
      : "--.- lbs";

    // ... a more robust version of your week change and goal progress logic would go here ...
    // For brevity, the logic is simplified here.
    if (goal && current_weight) {
      const weightChange = current_weight - goal.weight_lb;
      elements.goalProgressWeight.textContent = `${
        weightChange >= 0 ? "+" : ""
      }${weightChange.toFixed(1)} lbs`;
    } else {
      elements.goalProgressWeight.textContent = "-- lbs";
    }

    this.drawWeightChart(weight_data);
  },

  drawWeightChart(weightData) {
    if (weightChartInstance) weightChartInstance.destroy();
    if (!weightData || weightData.length < 2) return;

    const movingAverages = []; // Calculate moving averages
    for (let i = 0; i < weightData.length; i++) {
      const slice = weightData.slice(Math.max(0, i - 6), i + 1);
      const avg =
        slice.reduce((sum, entry) => sum + entry.weight_lb, 0) / slice.length;
      movingAverages.push(avg);
    }

    const labels = weightData.map((d) => new Date(d.date));
    const weightPoints = weightData.map((d) => d.weight_lb);

    // Chart.js configuration... (identical to your original, just using passed data)
    weightChartInstance = new Chart(elements.weightTrendCtx, {
      /* ... config ... */
    });
  },

  drawAdherenceChart(adherenceData) {
    if (adherenceChartInstance) adherenceChartInstance.destroy();
    if (!adherenceData || adherenceData.length === 0) return;

    const labels = adherenceData.map((d) => d.day);
    const calorieData = adherenceData.map((d) => d.caloriesAdherence);
    const proteinData = adherenceData.map((d) => d.proteinAdherence);

    // Chart.js configuration... (identical to your original)
    adherenceChartInstance = new Chart(elements.adherenceCtx, {
      /* ... config ... */
    });
  },

  setLoadingState(isLoading) {
    // Logic to show/hide a global spinner or update text to "Loading..."
    console.log(isLoading ? "Loading data..." : "Data loaded.");
  },

  showError(message) {
    // Logic to display a user-friendly error message, e.g., using a toast notification
    console.error(message);
    alert(message);
  },
};
