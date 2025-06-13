document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION & SUPABASE SETUP ---
  if (!window.APP_CONFIG) {
    console.error("Configuration not loaded. Please check that config.js is included before dashboard.js");
    alert("Configuration error. Please check console.");
    return;
  }

  const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const YOUR_USER_ID = window.APP_CONFIG.USER_ID;

  console.log("Synthetivolve Dashboard Initialized.");

  // --- STATE MANAGEMENT ---
  let currentGoal = null;
  let todayNutrition = null;
  let weeklyAdherence = [];

  // --- DOM REFERENCES ---
  const noGoalState = document.getElementById('no-goal-state');
  const activeGoalState = document.getElementById('active-goal-state');
  const goalNameEl = document.getElementById('goal-name');
  const daysRemainingEl = document.getElementById('days-remaining');
  const goalProgressFill = document.getElementById('goal-progress-fill');
  const targetCaloriesEl = document.getElementById('target-calories');
  const targetProteinEl = document.getElementById('target-protein');
  const targetCarbsEl = document.getElementById('target-carbs');
  const targetFatEl = document.getElementById('target-fat');
  
  // Today's Progress Elements
  const caloriesProgressEl = document.getElementById('calories-progress');
  const proteinProgressEl = document.getElementById('protein-progress');
  const carbsProgressEl = document.getElementById('carbs-progress');
  const fatProgressEl = document.getElementById('fat-progress');
  const caloriesProgressBar = document.getElementById('calories-progress-bar');
  const proteinProgressBar = document.getElementById('protein-progress-bar');
  const carbsProgressBar = document.getElementById('carbs-progress-bar');
  const fatProgressBar = document.getElementById('fat-progress-bar');
  
  // Chart Elements
  const adherenceCanvas = document.getElementById('adherence-canvas');
  const adherenceCtx = adherenceCanvas.getContext('2d');
  
  // Action Elements
  const updateGoalBtn = document.getElementById('update-goal-btn');

  // --- HELPER FUNCTIONS ---
  function formatDate(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
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
      element.style.backgroundColor = '#00f2ea'; // Primary glow - excellent
    } else if (percentage >= 75) {
      element.style.backgroundColor = '#4CAF50'; // Green - good
    } else if (percentage >= 50) {
      element.style.backgroundColor = '#FF9800'; // Orange - okay
    } else {
      element.style.backgroundColor = '#F44336'; // Red - needs work
    }
  }

  // --- DATA FETCHING FUNCTIONS ---
  
  async function fetchCurrentGoal() {
    try {
      const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', YOUR_USER_ID)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      currentGoal = data;
      console.log('Current goal:', currentGoal);
      return currentGoal;
    } catch (error) {
      console.error('Error fetching current goal:', error);
      return null;
    }
  }

  async function fetchTodayNutrition() {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('Fetching nutrition for:', startOfDay, 'to', endOfDay);

      const { data: entries, error } = await supabase
        .from('logged_entries')
        .select(`
          *,
          foods (
            calories,
            protein_g,
            carbs_g,
            fat_g,
            serving_size_g
          )
        `)
        .eq('user_id', YOUR_USER_ID)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString());

      if (error) {
        throw error;
      }

      console.log('Today\'s entries:', entries);

      // Calculate totals
      let totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          const food = entry.foods;
          if (food) {
            totals.calories += (food.calories || 0) * entry.quantity;
            totals.protein += (food.protein_g || 0) * entry.quantity;
            totals.carbs += (food.carbs_g || 0) * entry.quantity;
            totals.fat += (food.fat_g || 0) * entry.quantity;
          }
        });
      }

      todayNutrition = totals;
      console.log('Today\'s nutrition totals:', todayNutrition);
      return todayNutrition;
    } catch (error) {
      console.error('Error fetching today\'s nutrition:', error);
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }

  async function fetchWeeklyAdherence() {
    if (!currentGoal) return [];

    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6); // Last 7 days including today

      const adherenceData = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekAgo);
        date.setDate(weekAgo.getDate() + i);
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: entries, error } = await supabase
          .from('logged_entries')
          .select(`
            *,
            foods (
              calories,
              protein_g,
              carbs_g,
              fat_g
            )
          `)
          .eq('user_id', YOUR_USER_ID)
          .gte('logged_at', startOfDay.toISOString())
          .lte('logged_at', endOfDay.toISOString());

        if (error) {
          console.error('Error fetching data for', date, error);
          adherenceData.push({
            date: formatDate(date),
            caloriesAdherence: 0,
            proteinAdherence: 0
          });
          continue;
        }

        let dayTotals = { calories: 0, protein: 0 };
        
        if (entries && entries.length > 0) {
          entries.forEach(entry => {
            const food = entry.foods;
            if (food) {
              dayTotals.calories += (food.calories || 0) * entry.quantity;
              dayTotals.protein += (food.protein_g || 0) * entry.quantity;
            }
          });
        }

        // Calculate adherence percentages
        const caloriesAdherence = currentGoal.target_calories > 0 
          ? Math.min((dayTotals.calories / currentGoal.target_calories) * 100, 120) // Cap at 120%
          : 0;
        const proteinAdherence = currentGoal.target_protein_g > 0 
          ? Math.min((dayTotals.protein / currentGoal.target_protein_g) * 100, 120) // Cap at 120%
          : 0;

        adherenceData.push({
          date: formatDate(date),
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          caloriesAdherence,
          proteinAdherence
        });
      }

      weeklyAdherence = adherenceData;
      console.log('Weekly adherence data:', weeklyAdherence);
      return adherenceData;
    } catch (error) {
      console.error('Error fetching weekly adherence:', error);
      return [];
    }
  }

  // --- DISPLAY FUNCTIONS ---
  
  function displayCurrentGoal() {
    if (!currentGoal) {
      noGoalState.classList.remove('hidden');
      activeGoalState.classList.add('hidden');
      return;
    }

    noGoalState.classList.add('hidden');
    activeGoalState.classList.remove('hidden');

    // Update goal information
    goalNameEl.textContent = currentGoal.goal_name;
    targetCaloriesEl.textContent = currentGoal.target_calories;
    targetProteinEl.textContent = `${currentGoal.target_protein_g}g`;
    targetCarbsEl.textContent = `${currentGoal.target_carbs_g}g`;
    targetFatEl.textContent = `${currentGoal.target_fat_g}g`;

    // Update days remaining
    const daysLeft = calculateDaysRemaining(currentGoal.end_date);
    daysRemainingEl.textContent = daysLeft > 0 
      ? `${daysLeft} days remaining` 
      : 'Goal completed!';

    // Update progress bar
    const progressPercentage = calculateGoalProgress(currentGoal.start_date, currentGoal.end_date);
    goalProgressFill.style.width = `${progressPercentage}%`;
  }

  function displayTodayProgress() {
    if (!currentGoal || !todayNutrition) {
      // Show placeholder values
      caloriesProgressEl.textContent = '-- / --';
      proteinProgressEl.textContent = '-- / --g';
      carbsProgressEl.textContent = '-- / --g';
      fatProgressEl.textContent = '-- / --g';
      return;
    }

    // Update progress text
    caloriesProgressEl.textContent = `${Math.round(todayNutrition.calories)} / ${currentGoal.target_calories}`;
    proteinProgressEl.textContent = `${Math.round(todayNutrition.protein)} / ${currentGoal.target_protein_g}g`;
    carbsProgressEl.textContent = `${Math.round(todayNutrition.carbs)} / ${currentGoal.target_carbs_g}g`;
    fatProgressEl.textContent = `${Math.round(todayNutrition.fat)} / ${currentGoal.target_fat_g}g`;

    // Update progress bars
    updateProgressBar(caloriesProgressBar, todayNutrition.calories, currentGoal.target_calories);
    updateProgressBar(proteinProgressBar, todayNutrition.protein, currentGoal.target_protein_g);
    updateProgressBar(carbsProgressBar, todayNutrition.carbs, currentGoal.target_carbs_g);
    updateProgressBar(fatProgressBar, todayNutrition.fat, currentGoal.target_fat_g);
  }

  function drawAdherenceChart() {
    if (!weeklyAdherence.length) {
      adherenceCtx.clearRect(0, 0, adherenceCanvas.width, adherenceCanvas.height);
      adherenceCtx.fillStyle = '#666';
      adherenceCtx.font = '14px Roboto';
      adherenceCtx.textAlign = 'center';
      adherenceCtx.fillText('No data available', adherenceCanvas.width / 2, adherenceCanvas.height / 2);
      return;
    }

    // Clear canvas
    adherenceCtx.clearRect(0, 0, adherenceCanvas.width, adherenceCanvas.height);

    const width = adherenceCanvas.width;
    const height = adherenceCanvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw grid lines
    adherenceCtx.strokeStyle = '#333';
    adherenceCtx.lineWidth = 1;
    
    // Horizontal grid lines (25%, 50%, 75%, 100%)
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      adherenceCtx.beginPath();
      adherenceCtx.moveTo(padding, y);
      adherenceCtx.lineTo(width - padding, y);
      adherenceCtx.stroke();
      
      // Y-axis labels
      adherenceCtx.fillStyle = '#a0a0a0';
      adherenceCtx.font = '10px Roboto';
      adherenceCtx.textAlign = 'right';
      adherenceCtx.fillText(`${100 - (i * 25)}%`, padding - 5, y + 3);
    }

    // Draw data
    const barWidth = chartWidth / (weeklyAdherence.length * 2); // Two bars per day
    const barSpacing = 2;

    weeklyAdherence.forEach((day, index) => {
      const x = padding + (index * chartWidth / weeklyAdherence.length);
      
      // Calories bar (left)
      const caloriesHeight = (day.caloriesAdherence / 100) * chartHeight;
      adherenceCtx.fillStyle = '#00f2ea';
      adherenceCtx.fillRect(
        x + barSpacing, 
        padding + chartHeight - caloriesHeight, 
        barWidth - barSpacing, 
        caloriesHeight
      );
      
      // Protein bar (right)
      const proteinHeight = (day.proteinAdherence / 100) * chartHeight;
      adherenceCtx.fillStyle = '#ff00ff';
      adherenceCtx.fillRect(
        x + barWidth + barSpacing, 
        padding + chartHeight - proteinHeight, 
        barWidth - barSpacing, 
        proteinHeight
      );
      
      // Day labels
      adherenceCtx.fillStyle = '#a0a0a0';
      adherenceCtx.font = '10px Roboto';
      adherenceCtx.textAlign = 'center';
      adherenceCtx.fillText(
        day.day, 
        x + barWidth, 
        height - 10
      );
    });
  }

  // --- EVENT LISTENERS ---
  
  updateGoalBtn.addEventListener('click', () => {
    if (currentGoal) {
      if (confirm('This will deactivate your current goal and allow you to set a new one. Continue?')) {
        window.location.href = 'calculator.html';
      }
    } else {
      window.location.href = 'calculator.html';
    }
  });

  // --- INITIALIZATION AND DATA LOADING ---
  
  async function loadDashboardData() {
    try {
      console.log('Loading dashboard data...');
      
      // Show loading state
      document.querySelectorAll('.target-value, .progress-header span:last-child').forEach(el => {
        el.textContent = 'Loading...';
      });

      // Fetch current goal first
      await fetchCurrentGoal();
      displayCurrentGoal();

      // Fetch today's nutrition
      await fetchTodayNutrition();
      displayTodayProgress();

      // Fetch weekly adherence data
      await fetchWeeklyAdherence();
      drawAdherenceChart();

      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Show error state
      document.querySelectorAll('.target-value').forEach(el => {
        el.textContent = 'Error';
      });
    }
  }

  // --- AUTO-REFRESH ---
  
  function startAutoRefresh() {
    // Refresh today's progress every 2 minutes
    setInterval(async () => {
      if (!document.hidden) {
        await fetchTodayNutrition();
        displayTodayProgress();
      }
    }, 2 * 60 * 1000); // 2 minutes

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
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadDashboardData();
    }
  });
});