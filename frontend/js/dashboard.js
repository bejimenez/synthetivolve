document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION & SUPABASE SETUP ---
  if (!window.APP_CONFIG) {
    console.error(
      "Configuration not loaded. Please check that config.js is included before dashboard.js"
    );
    alert("Configuration error. Please check console.");
    return;
  }

  const API_BASE_URL = "http://127.0.0.1:8000";

  const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
  const YOUR_USER_ID = window.APP_CONFIG.USER_ID;

  console.log("Synthetivolve Dashboard Initialized.");

  // --- STATE MANAGEMENT ---
  let currentGoal = null;
  let todayNutrition = null;
  let weeklyAdherence = [];
  let weightData = [];
  let currentWeight = null;
  let sevenDayAverage = null;

  // --- DOM REFERENCES ---
  const noGoalState = document.getElementById("no-goal-state");
  const activeGoalState = document.getElementById("active-goal-state");
  const goalNameEl = document.getElementById("goal-name");
  const daysRemainingEl = document.getElementById("days-remaining");
  const goalProgressFill = document.getElementById("goal-progress-fill");
  const targetCaloriesEl = document.getElementById("target-calories");
  const targetProteinEl = document.getElementById("target-protein");
  const targetCarbsEl = document.getElementById("target-carbs");
  const targetFatEl = document.getElementById("target-fat");

  let weightChartInstance = null;
  let adherenceChartInstance = null;

  // Today's Progress Elements
  const caloriesProgressEl = document.getElementById("calories-progress");
  const proteinProgressEl = document.getElementById("protein-progress");
  const carbsProgressEl = document.getElementById("carbs-progress");
  const fatProgressEl = document.getElementById("fat-progress");
  const caloriesProgressBar = document.getElementById("calories-progress-bar");
  const proteinProgressBar = document.getElementById("protein-progress-bar");
  const carbsProgressBar = document.getElementById("carbs-progress-bar");
  const fatProgressBar = document.getElementById("fat-progress-bar");

  // Weight Logger Elements
  const currentWeightDisplay = document.getElementById(
    "current-weight-display"
  );
  const weightTrendIndicator = document.getElementById(
    "weight-trend-indicator"
  );
  const sevenDayAverageEl = document.getElementById("seven-day-average");
  const weekChangeEl = document.getElementById("week-change");
  const goalProgressWeightEl = document.getElementById("goal-progress-weight");
  const weightInput = document.getElementById("weight-input");
  const logWeightBtn = document.getElementById("log-weight-btn");
  const weightTrendChart = document.getElementById("weight-trend-chart");
  const weightTrendCtx = weightTrendChart.getContext("2d");

  // Chart Elements
  const adherenceCanvas = document.getElementById("adherence-canvas");
  const adherenceCtx = adherenceCanvas.getContext("2d");

  // Action Elements
  const updateGoalBtn = document.getElementById("update-goal-btn");

  // --- HELPER FUNCTIONS ---
  function formatDate(date) {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  function calculateDaysRemaining(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function calculateGoalProgress(startDate, endDate) {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDuration = end - start;
    const elapsed = today - start;
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  }

  function updateProgressBar(element, current, target) {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    element.style.width = `${percentage}%`;

    // Color coding based on progress
    if (percentage >= 90) {
      element.style.backgroundColor = "#00f2ea"; // Primary glow - excellent
    } else if (percentage >= 75) {
      element.style.backgroundColor = "#4CAF50"; // Green - good
    } else if (percentage >= 50) {
      element.style.backgroundColor = "#FF9800"; // Orange - okay
    } else {
      element.style.backgroundColor = "#F44336"; // Red - needs work
    }
  }

  // --- DATA FETCHING FUNCTIONS ---

  async function fetchCurrentGoal() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/current`);

      if (!response.ok) {
        // The server returned an error (e.g., 500)
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      currentGoal = data;
      console.log("Current goal (from API):", currentGoal);
      return currentGoal;
    } catch (error) {
      console.error("Error fetching current goal from API:", error);
      return null;
    }
  }

  async function fetchWeightData() {
    console.log("fetchWeightData() called");
    try {
      const response = await fetch(`${API_BASE_URL}/api/weight/data`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("fetchWeightData returned data:", data);

      weightData = data.weight_data || [];
      currentWeight = data.current_weight;
      sevenDayAverage = data.seven_day_average;
      
      console.log("currentWeight set to:", currentWeight);
      console.log("sevenDayAverage set to:", sevenDayAverage);

      return weightData;
    } catch (error) {
      console.error("Error fetching weight data:", error);
      currentWeight = null;
      sevenDayAverage = null;
      return [];
    }
  }

  async function logWeight(weight) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weight/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weight: weight })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Weight logged successfully:", result);

      // Refresh weight data
      await fetchWeightData();
      displayWeightData();
      drawWeightChart();

      return result;
    } catch (error) {
      console.error("Error logging weight:", error);
      throw error;
    }
  }

  async function fetchTodayNutrition() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/nutrition/today`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const totals = await response.json();
      console.log("Today's nutrition totals (from API):", totals);
      
      todayNutrition = totals;
      return todayNutrition;
    } catch (error) {
      console.error("Error fetching today's nutrition:", error);
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }

  async function fetchWeeklyAdherence() {
    if (!currentGoal) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/api/nutrition/weekly-adherence`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const adherenceData = await response.json();
      console.log("Weekly adherence data (from API):", adherenceData);
      
      weeklyAdherence = adherenceData;
      return weeklyAdherence;
    } catch (error) {
      console.error("Error fetching weekly adherence:", error);
      return [];
    }
  }

  // --- DISPLAY FUNCTIONS ---

  function displayCurrentGoal() {
    if (!currentGoal) {
      noGoalState.classList.remove("hidden");
      activeGoalState.classList.add("hidden");
      return;
    }

    noGoalState.classList.add("hidden");
    activeGoalState.classList.remove("hidden");

    // Update goal information
    goalNameEl.textContent = currentGoal.goal_name;
    targetCaloriesEl.textContent = currentGoal.target_calories;
    targetProteinEl.textContent = `${currentGoal.target_protein_g}g`;
    targetCarbsEl.textContent = `${currentGoal.target_carbs_g}g`;
    targetFatEl.textContent = `${currentGoal.target_fat_g}g`;

    // Update days remaining
    const daysLeft = calculateDaysRemaining(currentGoal.end_date);
    daysRemainingEl.textContent =
      daysLeft > 0 ? `${daysLeft} days remaining` : "Goal completed!";

    // Update progress bar
    const progressPercentage = calculateGoalProgress(
      currentGoal.start_date,
      currentGoal.end_date
    );
    goalProgressFill.style.width = `${progressPercentage}%`;
  }

  function displayTodayProgress() {
    if (!todayNutrition || !currentGoal) {
      // Clear or show loading state if data is not available
      caloriesProgressEl.textContent = "... / ... kcal";
      proteinProgressEl.textContent = "... / ... g";
      carbsProgressEl.textContent = "... / ... g";
      fatProgressEl.textContent = "... / ... g";
      updateProgressBar(caloriesProgressBar, 0, 1);
      updateProgressBar(proteinProgressBar, 0, 1);
      updateProgressBar(carbsProgressBar, 0, 1);
      updateProgressBar(fatProgressBar, 0, 1);
      return;
    }

    // Update the text showing current vs. target values
    caloriesProgressEl.textContent = `${Math.round(
      todayNutrition.calories
    )} / ${currentGoal.target_calories} kcal`;
    proteinProgressEl.textContent = `${Math.round(todayNutrition.protein)} / ${
      currentGoal.target_protein_g
    }g`;
    carbsProgressEl.textContent = `${Math.round(todayNutrition.carbs)} / ${
      currentGoal.target_carbs_g
    }g`;
    fatProgressEl.textContent = `${Math.round(todayNutrition.fat)} / ${
      currentGoal.target_fat_g
    }g`;

    // Update the visual progress bars
    updateProgressBar(
      caloriesProgressBar,
      todayNutrition.calories,
      currentGoal.target_calories
    );
    updateProgressBar(
      proteinProgressBar,
      todayNutrition.protein,
      currentGoal.target_protein_g
    );
    updateProgressBar(
      carbsProgressBar,
      todayNutrition.carbs,
      currentGoal.target_carbs_g
    );
    updateProgressBar(
      fatProgressBar,
      todayNutrition.fat,
      currentGoal.target_fat_g
    );
  }

  function displayWeightData() {
    console.log("displayWeightData called...");
    console.log("weightData:", weightData);
    console.log("currentWeight:", currentWeight, "type:", typeof currentWeight);
    console.log("sevenDayAverage:", sevenDayAverage);

    // Defensive: Only bail if explicitly null/undefined or not a number.
    if (typeof currentWeight !== "number" || isNaN(currentWeight)) {
      console.warn("displayWeightData: currentWeight invalid");
      currentWeightDisplay.textContent = "--.- lbs";
      sevenDayAverageEl.textContent = "--.- lbs";
      weekChangeEl.textContent = "-- lbs";
      goalProgressWeightEl.textContent = "-- lbs";
      return;
    }

    // Display current weight
    currentWeightDisplay.textContent = `${currentWeight.toFixed(1)} lbs`;

    // Display 7-day average
    if (typeof sevenDayAverage === "number") {
      sevenDayAverageEl.textContent = `${sevenDayAverage.toFixed(1)} lbs`;
    } else {
      sevenDayAverageEl.textContent = "--.- lbs";
    }

    // Calculate week change
    if (weightData.length >= 14) {
      const previous7Days = weightData.slice(-14, -7);
      const previousAvg =
        previous7Days.reduce((sum, entry) => sum + entry.weight_lb, 0) /
        previous7Days.length;
      const weekChange = sevenDayAverage - previousAvg;
      weekChangeEl.textContent = `${
        weekChange >= 0 ? "+" : ""
      }${weekChange.toFixed(1)} lbs`;
      weekChangeEl.className =
        weekChange > 0.2
          ? "trend-up"
          : weekChange < -0.2
          ? "trend-down"
          : "trend-stable";
    } else {
      weekChangeEl.textContent = "-- lbs";
    }

    // Calculate goal progress
    if (currentGoal && currentGoal.goal_type !== "maintain") {
      const startWeight = currentGoal.weight_lb;
      if (typeof startWeight === "number") {
        const weightChange = currentWeight - startWeight;
        goalProgressWeightEl.textContent = `${
          weightChange >= 0 ? "+" : ""
        }${weightChange.toFixed(1)} lbs`;

        if (currentGoal.goal_type === "lose") {
          goalProgressWeightEl.className =
            weightChange < -0.5
              ? "trend-down"
              : weightChange > 0.5
              ? "trend-up"
              : "trend-stable";
        } else if (currentGoal.goal_type === "gain") {
          goalProgressWeightEl.className =
            weightChange > 0.5
              ? "trend-up"
              : weightChange < -0.5
              ? "trend-down"
              : "trend-stable";
        }
      } else {
        goalProgressWeightEl.textContent = "-- lbs";
      }
    } else {
      goalProgressWeightEl.textContent = "-- lbs";
    }

    updateWeightTrendIndicator();
  }

  function updateWeightTrendIndicator() {
    if (weightData.length < 7) {
      weightTrendIndicator.innerHTML = '<i class="fas fa-minus"></i>';
      weightTrendIndicator.className = "weight-trend stable";
      return;
    }

    // Compare current 7-day average to previous period
    const last7Days = weightData.slice(-7);
    const previous7Days = weightData.slice(-14, -7);

    if (previous7Days.length < 7) {
      weightTrendIndicator.innerHTML = '<i class="fas fa-minus"></i>';
      weightTrendIndicator.className = "weight-trend stable";
      return;
    }

    const currentAvg =
      last7Days.reduce((sum, entry) => sum + entry.weight_lb, 0) /
      last7Days.length;
    const previousAvg =
      previous7Days.reduce((sum, entry) => sum + entry.weight_lb, 0) /
      previous7Days.length;
    const change = currentAvg - previousAvg;

    if (change > 0.3) {
      weightTrendIndicator.innerHTML = '<i class="fas fa-arrow-trend-up"></i>';
      weightTrendIndicator.className = "weight-trend increasing";
    } else if (change < -0.3) {
      weightTrendIndicator.innerHTML =
        '<i class="fas fa-arrow-trend-down"></i>';
      weightTrendIndicator.className = "weight-trend decreasing";
    } else {
      weightTrendIndicator.innerHTML = '<i class="fas fa-minus"></i>';
      weightTrendIndicator.className = "weight-trend stable";
    }
  }

  function drawWeightChart() {
    if (weightChartInstance) {
      weightChartInstance.destroy(); // Destroy the old chart before drawing a new one
    }

    if (!weightData || weightData.length < 2) {
      // Handle empty/insufficient data state if needed
      weightTrendCtx.clearRect(
        0,
        0,
        weightTrendChart.width,
        weightTrendChart.height
      );
      return;
    }

    // Calculate 7-day moving averages for the trend line
    const movingAverages = [];
    for (let i = 0; i < weightData.length; i++) {
      const start = Math.max(0, i - 6);
      const slice = weightData.slice(start, i + 1);
      const avg =
        slice.reduce((sum, entry) => sum + entry.weight_lb, 0) / slice.length;
      movingAverages.push(avg);
    }

    // Prepare data for Chart.js
    const labels = weightData.map((d) => new Date(d.date));
    const weightPoints = weightData.map((d) => d.weight_lb);
    const trendLine = movingAverages.map((avg) => avg.toFixed(2));

    weightChartInstance = new Chart(weightTrendCtx, {
      type: "line", // Base type is line
      data: {
        labels: labels,
        datasets: [
          {
            label: "7-Day Avg",
            data: trendLine,
            borderColor: "#00f2ea",
            backgroundColor: "#00f2ea",
            tension: 0.3, // Makes the line smooth
            borderWidth: 3,
            pointRadius: 0, // Hide points for the trend line
          },
          {
            label: "Daily Weight",
            data: weightPoints,
            borderColor: "transparent",
            backgroundColor: "#666",
            type: "scatter", // Override to scatter for individual points
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // We don't need a legend for this chart
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += `${context.parsed.y} lbs`;
                }
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "MMM d, yyyy",
              displayFormats: {
                day: "MMM d",
              },
            },
            grid: {
              color: "#333",
            },
            ticks: {
              color: "#a0a0a0",
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 7, // Limit number of date labels
            },
          },
          y: {
            beginAtZero: false, // Don't force y-axis to start at 0
            grid: {
              color: "#333",
            },
            ticks: {
              color: "#a0a0a0",
              callback: function (value) {
                return value.toFixed(1) + " lbs";
              },
            },
          },
        },
      },
    });
  }

  function drawAdherenceChart() {
    if (adherenceChartInstance) {
      adherenceChartInstance.destroy(); // Destroy old instance
    }

    if (!adherenceCtx || !weeklyAdherence || weeklyAdherence.length === 0) {
      // Handle empty state if needed
      return;
    }

    const labels = weeklyAdherence.map((d) => d.day);
    const calorieData = weeklyAdherence.map((d) => d.caloriesAdherence);
    const proteinData = weeklyAdherence.map((d) => d.proteinAdherence);

    adherenceChartInstance = new Chart(adherenceCtx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Calories",
            data: calorieData,
            backgroundColor: "#00f2ea",
            borderColor: "#00c1b8",
            borderWidth: 1,
          },
          {
            label: "Protein",
            data: proteinData,
            backgroundColor: "#ff9800",
            borderColor: "#e68900",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#ccc", // Style legend text color
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(
                  0
                )}%`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 120, // Keep the 120% cap
            grid: {
              color: "#333",
            },
            ticks: {
              color: "#a0a0a0",
              callback: function (value) {
                return value + "%";
              },
            },
          },
          x: {
            grid: {
              color: "transparent", // Hide vertical grid lines for a cleaner look
            },
            ticks: {
              color: "#a0a0a0",
            },
          },
        },
      },
    });
  }

  // --- EVENT LISTENERS ---

  updateGoalBtn.addEventListener("click", () => {
    if (currentGoal) {
      if (
        confirm(
          "This will deactivate your current goal and allow you to set a new one. Continue?"
        )
      ) {
        window.location.href = "calculator.html";
      }
    } else {
      window.location.href = "calculator.html";
    }
  });

  // Weight logging event listeners
  weightInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleWeightSubmission();
    }
  });

  logWeightBtn.addEventListener("click", handleWeightSubmission);

  async function handleWeightSubmission() {
    const weight = parseFloat(weightInput.value);

    if (!weight || weight < 50 || weight > 500) {
      alert("Please enter a valid weight between 50 and 500 lbs");
      weightInput.focus();
      return;
    }

    try {
      logWeightBtn.disabled = true;
      logWeightBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Logging...';

      await logWeight(weight);

      // Success feedback
      weightInput.value = "";
      logWeightBtn.classList.add("weight-logged");

      // Show success message briefly
      const originalText = logWeightBtn.innerHTML;
      logWeightBtn.innerHTML = '<i class="fas fa-check"></i> Logged!';
      logWeightBtn.style.backgroundColor = "#4CAF50";

      setTimeout(() => {
        logWeightBtn.innerHTML = '<i class="fas fa-plus"></i> Log';
        logWeightBtn.style.backgroundColor = "";
        logWeightBtn.classList.remove("weight-logged");
      }, 2000);
    } catch (error) {
      console.error("Error logging weight:", error);
      alert("Failed to log weight. Please try again.");
    } finally {
      logWeightBtn.disabled = false;
    }
  }

  // Auto-focus weight input when user starts typing a number
  document.addEventListener("keypress", (e) => {
    if (
      e.key >= "0" &&
      e.key <= "9" &&
      !weightInput.contains(document.activeElement)
    ) {
      weightInput.focus();
      weightInput.value = e.key;
    }
  });

  // --- INITIALIZATION AND DATA LOADING ---

  // --- INITIALIZATION AND DATA LOADING ---

  async function loadDashboardData() {
    try {
      console.log("Loading dashboard data...");

      // Show a global loading state
      document
        .querySelectorAll(
          ".target-value, .progress-header span:last-child, .stat-value"
        )
        .forEach((el) => {
          el.textContent = "Loading...";
        });

      // 1. Fetch the current goal first, as many other calls depend on it.
      const goal = await fetchCurrentGoal();
      displayCurrentGoal(); // We can display this immediately.

      // 2. Now, fetch the remaining data in parallel.
      const [nutritionData, weightDataResult] = await Promise.all([
        fetchTodayNutrition(),
        fetchWeightData(),
      ]);

      // 3. Display the data that depended on the goal.
      // By now, `currentGoal`, `todayNutrition`, and `weightData` global variables are all set.
      displayTodayProgress();
      displayWeightData();
      drawWeightChart();

      // 4. Fetch and display weekly adherence, which also depends on the goal.
      // This is last as it's the most intensive query.
      await fetchWeeklyAdherence();
      drawAdherenceChart();

      console.log("Dashboard data loaded successfully");
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Show error state
      document.querySelectorAll(".target-value, .stat-value").forEach((el) => {
        el.textContent = "Error";
      });
      // Also clear the progress values
      document
        .querySelectorAll(".progress-header span:last-child")
        .forEach((el) => {
          el.textContent = "Error";
        });
    }
  }

  // --- AUTO-REFRESH ---

  function startAutoRefresh() {
    // Refresh nutrition progress every 2 minutes
    setInterval(async () => {
      if (!document.hidden) {
        await fetchTodayNutrition();
        displayTodayProgress();
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Refresh weight data every 5 minutes (in case of updates from other devices)
    setInterval(async () => {
      if (!document.hidden) {
        await fetchWeightData();
        displayWeightData();
        drawWeightChart();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Refresh all data every 10 minutes
    setInterval(async () => {
      if (!document.hidden) {
        await loadDashboardData();
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  // --- INITIALIZE DASHBOARD ---

  // Load data on page load
  loadDashboardData();

  // Start auto-refresh
  startAutoRefresh();

  // Refresh data when page becomes visible
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadDashboardData();
    }
  });

  // Set focus to weight input on page load for quick logging
  setTimeout(() => {
    if (weightInput && !weightInput.value) {
      weightInput.focus();
    }
  }, 1000);
});
