// synthetivolve/frontend/js/ui.js
import { calculateDaysRemaining, calculateGoalProgress } from "./utils.js";

console.log("🔄 [RELOAD CHECK] ui.js loaded at:", new Date().toISOString());

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
    console.log("🎨 [UI] renderGoal", goal);
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
    console.log("🎨 [UI] renderTodayProgress", { nutrition, goal });
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
    console.group("🎨 [UI] renderWeightData");
    console.log("  - Data received:", { weightSummary, goal });
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
    console.groupEnd();
  },

  drawWeightChart(weightData) {
    console.group("🖌️ [CHART] drawWeightChart");
    console.log("  - Drawing with data:", weightData);
    console.log("🔍 [DEBUG] Chart.js availability:", typeof Chart !== 'undefined' ? 'LOADED' : 'NOT LOADED');
    console.log("🔍 [DEBUG] weightChartInstance:", weightChartInstance);

    console.log("🔄 [RELOAD CHECK] drawWeightChart called at:", new Date().toISOString());

    // Track canvas state
    const canvas = elements.weightTrendCtx.canvas;
    console.log("🔍 [DEBUG] Canvas state:", {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        parentElement: canvas.parentElement?.tagName,
        isConnected: canvas.isConnected
    });

    // 1. Destroy any existing chart instance to prevent memory leaks on refresh
    if (weightChartInstance) {
      console.log("  - Destroying existing weight chart instance.");
      weightChartInstance.destroy();
    }

    // 2. Handle the "no data" or "not enough data" case
    if (!weightData || weightData.length < 2) {
      console.warn("  - Not enough data for weight chart. Displaying message.");
      // You can display a message directly on the canvas if you want
      const ctx = elements.weightTrendCtx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.font = "14px Roboto";
      ctx.fillStyle = "#666";
      ctx.textAlign = "center";
      ctx.fillText(
        "Log at least two entries to see your weight trend.",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );
      console.groupEnd();
      return;
    }

    // 3. Prepare the data for Chart.js
    // Chart.js's time scale works best with data in {x, y} format
    const labels = weightData.map((d) => new Date(d.date));
    const weightPoints = weightData.map((d) => ({
      x: new Date(d.date),
      y: d.weight_lb,
    }));

    // Calculate the 7-day moving average, same logic as your old code
    const movingAverages = [];
    for (let i = 0; i < weightData.length; i++) {
      const start = Math.max(0, i - 6);
      const slice = weightData.slice(start, i + 1);
      const avg =
        slice.reduce((sum, entry) => sum + entry.weight_lb, 0) / slice.length;
      movingAverages.push({
        x: new Date(weightData[i].date),
        y: avg,
      });
    }

    // 4. Create the new chart using Chart.js
    console.log("🔍 [DEBUG] About to create Chart with context:", elements.weightTrendCtx);
    console.log("🔍 [DEBUG] Canvas dimensions:", elements.weightTrendCtx.canvas.width, elements.weightTrendCtx.canvas.height);
    weightChartInstance = new Chart(elements.weightTrendCtx, {
    type: 'line',
    data: {
        datasets: [
            {
                label: '7-Day Average',
                data: movingAverages,
                borderColor: '#00f2ea',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                fill: false  // Add this to prevent fill issues
            },
            {
                label: 'Daily Weight',
                data: weightPoints,
                backgroundColor: '#666',
                borderColor: '#666',  // Add explicit border color
                showLine: false,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false  // Add this
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        onResize: (chart, size) => {
            console.log("📏 [CHART RESIZE] Weight chart resized:", size);
        },
        animation: {
            onComplete: () => {
                console.log("✅ [CHART ANIMATION] Weight chart animation complete");
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: true,  // Ensure legend is displayed
                labels: {
                    color: '#fff',
                    usePointStyle: true  // Add this for better legend
                }
            },
            tooltip: {
                enabled: true,  // Explicitly enable tooltips
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} lbs`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'MMM d, yyyy',
                    displayFormats: {
                        day: 'MMM d'  // Add display format
                    }
                },
                ticks: {
                    color: '#ccc',
                    maxRotation: 0,  // Prevent label rotation
                    autoSkip: true   // Allow automatic skipping
                },
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: false,
                ticks: {
                    color: '#ccc',
                    callback: function (value) {
                        return `${value.toFixed(1)} lbs`;
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        }
    }
});

    console.log("  - ✅ New weight chart instance created.");
    console.groupEnd();
  },

  drawAdherenceChart(adherenceData) {
    console.group("🖌️ [CHART] drawAdherenceChart");
    console.log("  - Drawing with data:", adherenceData);
    // Destroy the old chart instance if it exists
    if (adherenceChartInstance) {
      console.log("  - Destroying existing adherence chart instance.");
      adherenceChartInstance.destroy();
    }

    // Guard clause: if no data, do nothing.
    // Your SQL function always returns 7 days, so this is a good safety check.
    if (!adherenceData || adherenceData.length === 0) {
      const ctx = elements.adherenceCtx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous drawings
      ctx.font = "14px Roboto";
      ctx.fillStyle = "#666";
      ctx.textAlign = "center";
      ctx.fillText(
        "Not enough data to display weekly adherence.",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );
      return; // Exit the function
    }
    // The keys (e.g., 'caloriesAdherence') match the camelCase aliases from Pydantic
    const labels = adherenceData.map((d) => d.day);
    const calorieData = adherenceData.map((d) => d.caloriesAdherence);
    const proteinData = adherenceData.map((d) => d.proteinAdherence);
    const carbData = adherenceData.map((d) => d.carbsAdherence);
    const fatData = adherenceData.map((d) => d.fatAdherence);

    // --- FIX: Provide the complete Chart.js configuration ---
    adherenceChartInstance = new Chart(elements.adherenceCtx, {
      type: 'bar', // A bar chart is great for this kind of comparison
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Calories %',
            data: calorieData,
            backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: 'Protein %',
            data: proteinData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Carbs %',
            data: carbData,
            backgroundColor: 'rgba(255, 206, 86, 0.6)', // Yellow
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1,
          },
          {
            label: 'Fat %',
            data: fatData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)', // Green
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#fff', // White text for legend
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += `${context.parsed.y.toFixed(0)}%`;
                }
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 120, // Match the 120% cap from your SQL function
            ticks: {
              color: '#ccc', // Light grey text for Y-axis
              callback: function (value) {
                return value + '%'; // Add a '%' sign to the Y-axis numbers
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)', // Faint grid lines
            },
          },
          x: {
            ticks: {
              color: '#ccc', // Light grey text for X-axis
            },
            grid: {
              display: false, // Hide vertical grid lines
            },
          },
        },
      },
    });
    console.log("  - ✅ New adherence chart instance created.");
    console.groupEnd();
  },

  setLoadingState(isLoading) {
    // Logic to show/hide a global spinner or update text to "Loading..."
    console.log(isLoading ? "Loading data..." : "Data loaded.");
  },

  showError(message) {
    console.error(`🚨 [UI] showError: ${message}`);
    // Logic to display a user-friendly error message, e.g., using a toast notification
    console.error(message);
    alert(message);
  },
};
