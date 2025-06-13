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
  let weightData = [];
  let currentWeight = null;
  let sevenDayAverage = null;

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
  
  // Weight Logger Elements
  const currentWeightDisplay = document.getElementById('current-weight-display');
  const weightTrendIndicator = document.getElementById('weight-trend-indicator');
  const sevenDayAverageEl = document.getElementById('seven-day-average');
  const weekChangeEl = document.getElementById('week-change');
  const goalProgressWeightEl = document.getElementById('goal-progress-weight');
  const weightInput = document.getElementById('weight-input');
  const logWeightBtn = document.getElementById('log-weight-btn');
  const weightTrendChart = document.getElementById('weight-trend-chart');
  const weightTrendCtx = weightTrendChart.getContext('2d');
  
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

  async function fetchWeightData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', YOUR_USER_ID)
        .gte('date', formatDate(thirtyDaysAgo))
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      weightData = data || [];
      console.log('Weight data:', weightData);

      // Calculate current weight and 7-day average
      if (weightData.length > 0) {
        // Get most recent weight
        currentWeight = weightData[weightData.length - 1].weight_lb;

        // Calculate 7-day average
        const last7Days = weightData.slice(-7);
        sevenDayAverage = last7Days.reduce((sum, entry) => sum + entry.weight_lb, 0) / last7Days.length;
      }

      return weightData;
    } catch (error) {
      console.error('Error fetching weight data:', error);
      return [];
    }
  }

  async function logWeight(weight) {
    try {
      const today = formatDate(new Date());
      
      // Check if entry already exists for today
      const { data: existingEntry, error: checkError } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', YOUR_USER_ID)
        .eq('date', today)
        .single();

      let result;
      if (existingEntry) {
        // Update existing entry
        const { data, error } = await supabase
          .from('weight_entries')
          .update({ 
            weight_lb: weight,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEntry.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        console.log('Updated weight entry:', result);
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('weight_entries')
          .insert([{
            user_id: YOUR_USER_ID,
            date: today,
            weight_lb: weight
          }])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        console.log('Created new weight entry:', result);
      }

      // Refresh weight data
      await fetchWeightData();
      displayWeightData();
      drawWeightChart();

      return result;
    } catch (error) {
      console.error('Error logging weight:', error);
      throw error;
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
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0); // Start of the day, 7 days ago

        // Fetch all entries for the last 7 days in ONE query
        const { data: entries, error } = await supabase
            .from('logged_entries')
            .select(`*, foods (calories, protein_g)`)
            .eq('user_id', YOUR_USER_ID)
            .gte('logged_at', weekAgo.toISOString());

        if (error) throw error;
        
        // Create a map to store totals for each day
        const dailyTotals = new Map();

        // Initialize the map with all 7 days to ensure days with no logs are included
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekAgo);
            date.setDate(weekAgo.getDate() + i);
            const dateString = formatDate(date);
            dailyTotals.set(dateString, { 
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                calories: 0, 
                protein: 0 
            });
        }
        
        // Process the fetched entries and add to the daily totals
        entries.forEach(entry => {
            const entryDate = formatDate(new Date(entry.logged_at));
            if (dailyTotals.has(entryDate)) {
                const dayData = dailyTotals.get(entryDate);
                const food = entry.foods;
                if (food) {
                    dayData.calories += (food.calories || 0) * entry.quantity;
                    dayData.protein += (food.protein_g || 0) * entry.quantity;
                }
            }
        });

        // Convert the map to the final adherence array
        const adherenceData = Array.from(dailyTotals.entries()).map(([date, totals]) => {
            const caloriesAdherence = currentGoal.target_calories > 0 
                ? Math.min((totals.calories / currentGoal.target_calories) * 100, 120)
                : 0;
            const proteinAdherence = currentGoal.target_protein_g > 0 
                ? Math.min((totals.protein / currentGoal.target_protein_g) * 100, 120)
                : 0;
            
            return {
                date,
                day: totals.day,
                caloriesAdherence,
                proteinAdherence
            };
        });

        weeklyAdherence = adherenceData;
        console.log('Weekly adherence data (optimized):', weeklyAdherence);
        return weeklyAdherence;
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
    if (!todayNutrition || !currentGoal) {
      // Clear or show loading state if data is not available
      caloriesProgressEl.textContent = '... / ... kcal';
      proteinProgressEl.textContent = '... / ... g';
      carbsProgressEl.textContent = '... / ... g';
      fatProgressEl.textContent = '... / ... g';
      updateProgressBar(caloriesProgressBar, 0, 1);
      updateProgressBar(proteinProgressBar, 0, 1);
      updateProgressBar(carbsProgressBar, 0, 1);
      updateProgressBar(fatProgressBar, 0, 1);
      return;
    }

    // Update the text showing current vs. target values
    caloriesProgressEl.textContent = `${Math.round(todayNutrition.calories)} / ${currentGoal.target_calories} kcal`;
    proteinProgressEl.textContent = `${Math.round(todayNutrition.protein)} / ${currentGoal.target_protein_g}g`;
    carbsProgressEl.textContent = `${Math.round(todayNutrition.carbs)} / ${currentGoal.target_carbs_g}g`;
    fatProgressEl.textContent = `${Math.round(todayNutrition.fat)} / ${currentGoal.target_fat_g}g`;

    // Update the visual progress bars
    updateProgressBar(caloriesProgressBar, todayNutrition.calories, currentGoal.target_calories);
    updateProgressBar(proteinProgressBar, todayNutrition.protein, currentGoal.target_protein_g);
    updateProgressBar(carbsProgressBar, todayNutrition.carbs, currentGoal.target_carbs_g);
    updateProgressBar(fatProgressBar, todayNutrition.fat, currentGoal.target_fat_g);
  }

  function displayWeightData() {
    if (!currentWeight) {
      currentWeightDisplay.textContent = '--.- lbs';
      sevenDayAverageEl.textContent = '--.- lbs';
      weekChangeEl.textContent = '-- lbs';
      goalProgressWeightEl.textContent = '-- lbs';
      return;
    }

    // Display current weight
    currentWeightDisplay.textContent = `${currentWeight.toFixed(1)} lbs`;

    // Display 7-day average
    if (sevenDayAverage) {
      sevenDayAverageEl.textContent = `${sevenDayAverage.toFixed(1)} lbs`;
    }

    // Calculate week change (compare current 7-day avg to previous 7-day avg)
    if (weightData.length >= 14) {
      const previous7Days = weightData.slice(-14, -7);
      const previousAvg = previous7Days.reduce((sum, entry) => sum + entry.weight_lb, 0) / previous7Days.length;
      const weekChange = sevenDayAverage - previousAvg;
      
      weekChangeEl.textContent = `${weekChange >= 0 ? '+' : ''}${weekChange.toFixed(1)} lbs`;
      weekChangeEl.className = weekChange > 0.2 ? 'trend-up' : weekChange < -0.2 ? 'trend-down' : 'trend-stable';
    }

    // Calculate goal progress (if there's an active goal)
    if (currentGoal && currentGoal.goal_type !== 'maintain') {
      const startWeight = currentGoal.weight_lb;
      if (startWeight) {
        const weightChange = currentWeight - startWeight;
        goalProgressWeightEl.textContent = `${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} lbs`;
        
        // Color code based on goal type
        if (currentGoal.goal_type === 'lose') {
          goalProgressWeightEl.className = weightChange < -0.5 ? 'trend-down' : weightChange > 0.5 ? 'trend-up' : 'trend-stable';
        } else if (currentGoal.goal_type === 'gain') {
          goalProgressWeightEl.className = weightChange > 0.5 ? 'trend-up' : weightChange < -0.5 ? 'trend-down' : 'trend-stable';
        }
      }
    }

    // Update trend indicator
    updateWeightTrendIndicator();
  }

  function updateWeightTrendIndicator() {
    if (weightData.length < 7) {
      weightTrendIndicator.innerHTML = '<i class="fas fa-minus"></i>';
      weightTrendIndicator.className = 'weight-trend stable';
      return;
    }

    // Compare current 7-day average to previous period
    const last7Days = weightData.slice(-7);
    const previous7Days = weightData.slice(-14, -7);
    
    if (previous7Days.length < 7) {
      weightTrendIndicator.innerHTML = '<i class="fas fa-minus"></i>';
      weightTrendIndicator.className = 'weight-trend stable';
      return;
    }

    const currentAvg = last7Days.reduce((sum, entry) => sum + entry.weight_lb, 0) / last7Days.length;
    const previousAvg = previous7Days.reduce((sum, entry) => sum + entry.weight_lb, 0) / previous7Days.length;
    const change = currentAvg - previousAvg;

    if (change > 0.3) {
      weightTrendIndicator.innerHTML = '<i class="fas fa-arrow-trend-up"></i>';
      weightTrendIndicator.className = 'weight-trend increasing';
    } else if (change < -0.3) {
      weightTrendIndicator.innerHTML = '<i class="fas fa-arrow-trend-down"></i>';
      weightTrendIndicator.className = 'weight-trend decreasing';
    } else {
      weightTrendIndicator.innerHTML = '<i class="fas fa-minus"></i>';
      weightTrendIndicator.className = 'weight-trend stable';
    }
  }

  function drawWeightChart() {
    if (!weightData.length) {
      weightTrendCtx.clearRect(0, 0, weightTrendChart.width, weightTrendChart.height);
      weightTrendCtx.fillStyle = '#666';
      weightTrendCtx.font = '14px Roboto';
      weightTrendCtx.textAlign = 'center';
      weightTrendCtx.fillText('No weight data available', weightTrendChart.width / 2, weightTrendChart.height / 2);
      return;
    }

    // Clear canvas
    weightTrendCtx.clearRect(0, 0, weightTrendChart.width, weightTrendChart.height);

    const width = weightTrendChart.width;
    const height = weightTrendChart.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate data ranges
    const weights = weightData.map(d => d.weight_lb);
    const minWeight = Math.min(...weights) - 2;
    const maxWeight = Math.max(...weights) + 2;
    const weightRange = maxWeight - minWeight;

    // Calculate 7-day moving averages for smooth trend line
    const movingAverages = [];
    for (let i = 0; i < weightData.length; i++) {
      const start = Math.max(0, i - 6);
      const slice = weightData.slice(start, i + 1);
      const avg = slice.reduce((sum, entry) => sum + entry.weight_lb, 0) / slice.length;
      movingAverages.push(avg);
    }

    // Draw grid lines
    weightTrendCtx.strokeStyle = '#333';
    weightTrendCtx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      const weight = maxWeight - (weightRange / 4) * i;
      
      weightTrendCtx.beginPath();
      weightTrendCtx.moveTo(padding, y);
      weightTrendCtx.lineTo(width - padding, y);
      weightTrendCtx.stroke();
      
      // Y-axis labels
      weightTrendCtx.fillStyle = '#a0a0a0';
      weightTrendCtx.font = '10px Roboto';
      weightTrendCtx.textAlign = 'right';
      weightTrendCtx.fillText(`${weight.toFixed(1)}`, padding - 5, y + 3);
    }

    // Draw individual weight points
    weightTrendCtx.fillStyle = '#666';
    weightData.forEach((entry, index) => {
      const x = padding + (index / (weightData.length - 1)) * chartWidth;
      const y = padding + ((maxWeight - entry.weight_lb) / weightRange) * chartHeight;
      
      weightTrendCtx.beginPath();
      weightTrendCtx.arc(x, y, 2, 0, 2 * Math.PI);
      weightTrendCtx.fill();
    });

    // Draw 7-day moving average line
    if (movingAverages.length > 1) {
      weightTrendCtx.strokeStyle = '#00f2ea';
      weightTrendCtx.lineWidth = 3;
      weightTrendCtx.beginPath();
      
      movingAverages.forEach((avg, index) => {
        const x = padding + (index / (weightData.length - 1)) * chartWidth;
        const y = padding + ((maxWeight - avg) / weightRange) * chartHeight;
        
        if (index === 0) {
          weightTrendCtx.moveTo(x, y);
        } else {
          weightTrendCtx.lineTo(x, y);
        }
      });
      
      weightTrendCtx.stroke();
    }

    // Draw date labels (show every few days to avoid crowding)
    const labelInterval = Math.max(1, Math.floor(weightData.length / 7));
    weightTrendCtx.fillStyle = '#a0a0a0';
    weightTrendCtx.font = '9px Roboto';
    weightTrendCtx.textAlign = 'center';
    
    weightData.forEach((entry, index) => {
      if (index % labelInterval === 0 || index === weightData.length - 1) {
        const x = padding + (index / (weightData.length - 1)) * chartWidth;
        const date = new Date(entry.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        weightTrendCtx.fillText(label, x, height - 10);
      }
    });
  }

    function drawAdherenceChart() {
    if (!adherenceCtx) return;

    // Clear previous chart
    adherenceCtx.clearRect(0, 0, adherenceCanvas.width, adherenceCanvas.height);

    if (!weeklyAdherence || weeklyAdherence.length === 0) {
      adherenceCtx.fillStyle = '#666';
      adherenceCtx.font = '14px Roboto';
      adherenceCtx.textAlign = 'center';
      adherenceCtx.fillText('No adherence data to display', adherenceCanvas.width / 2, adherenceCanvas.height / 2);
      return;
    }

    const width = adherenceCanvas.width;
    const height = adherenceCanvas.height;
    const padding = 35;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 1.5;
    const barGroupWidth = chartWidth / weeklyAdherence.length;
    const barWidth = barGroupWidth * 0.35;
    const maxAdherence = 120; // Capped at 120% in the fetch function

    // Draw grid lines and labels (0%, 50%, 100%)
    adherenceCtx.strokeStyle = '#333';
    adherenceCtx.lineWidth = 1;
    adherenceCtx.fillStyle = '#a0a0a0';
    adherenceCtx.font = '10px Roboto';
    adherenceCtx.textAlign = 'right';

    for (let i = 0; i <= 2; i++) {
        const percentage = i * 50;
        const y = padding + chartHeight - (percentage / 100) * chartHeight;

        adherenceCtx.beginPath();
        adherenceCtx.moveTo(padding, y);
        adherenceCtx.lineTo(width - padding, y);
        adherenceCtx.stroke();

        adherenceCtx.fillText(`${percentage}%`, padding - 8, y + 3);
    }


    // Draw bars for each day
    weeklyAdherence.forEach((dayData, index) => {
      const x = padding + index * barGroupWidth;

      // Calculate bar heights
      const calHeight = (dayData.caloriesAdherence / maxAdherence) * chartHeight;
      const proHeight = (dayData.proteinAdherence / maxAdherence) * chartHeight;

      // Draw Calorie Bar (primary color)
      adherenceCtx.fillStyle = '#00f2ea';
      adherenceCtx.fillRect(
        x + barGroupWidth * 0.1, 
        padding + chartHeight - calHeight, 
        barWidth, 
        calHeight
      );

      // Draw Protein Bar (secondary color)
      adherenceCtx.fillStyle = '#ff9800';
      adherenceCtx.fillRect(
        x + barGroupWidth * 0.1 + barWidth + 5, 
        padding + chartHeight - proHeight, 
        barWidth, 
        proHeight
      );
      
      // Draw Day Label
      adherenceCtx.fillStyle = '#a0a0a0';
      adherenceCtx.font = '11px Roboto';
      adherenceCtx.textAlign = 'center';
      adherenceCtx.fillText(dayData.day, x + barGroupWidth / 2, height - 10);
    });
    
    // Draw Legend
    adherenceCtx.textAlign = 'left';
    adherenceCtx.font = '12px Roboto';
    // Calorie Legend
    adherenceCtx.fillStyle = '#00f2ea';
    adherenceCtx.fillRect(padding, 5, 10, 10);
    adherenceCtx.fillStyle = '#ccc';
    adherenceCtx.fillText('Calories', padding + 15, 14);
    // Protein Legend
    adherenceCtx.fillStyle = '#ff9800';
    adherenceCtx.fillRect(padding + 90, 5, 10, 10);
    adherenceCtx.fillStyle = '#ccc';
    adherenceCtx.fillText('Protein', padding + 105, 14);
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

  // Weight logging event listeners
  weightInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleWeightSubmission();
    }
  });

  logWeightBtn.addEventListener('click', handleWeightSubmission);

  async function handleWeightSubmission() {
    const weight = parseFloat(weightInput.value);
    
    if (!weight || weight < 50 || weight > 500) {
      alert('Please enter a valid weight between 50 and 500 lbs');
      weightInput.focus();
      return;
    }

    try {
      logWeightBtn.disabled = true;
      logWeightBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging...';

      await logWeight(weight);
      
      // Success feedback
      weightInput.value = '';
      logWeightBtn.classList.add('weight-logged');
      
      // Show success message briefly
      const originalText = logWeightBtn.innerHTML;
      logWeightBtn.innerHTML = '<i class="fas fa-check"></i> Logged!';
      logWeightBtn.style.backgroundColor = '#4CAF50';
      
      setTimeout(() => {
        logWeightBtn.innerHTML = '<i class="fas fa-plus"></i> Log';
        logWeightBtn.style.backgroundColor = '';
        logWeightBtn.classList.remove('weight-logged');
      }, 2000);

    } catch (error) {
      console.error('Error logging weight:', error);
      alert('Failed to log weight. Please try again.');
    } finally {
      logWeightBtn.disabled = false;
    }
  }

  // Auto-focus weight input when user starts typing a number
  document.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9' && !weightInput.contains(document.activeElement)) {
      weightInput.focus();
      weightInput.value = e.key;
    }
  });

  // --- INITIALIZATION AND DATA LOADING ---
  
  // --- INITIALIZATION AND DATA LOADING ---
  
async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');

        // Show a global loading state
        document.querySelectorAll('.target-value, .progress-header span:last-child, .stat-value').forEach(el => {
            el.textContent = 'Loading...';
        });

        // 1. Fetch the current goal first, as many other calls depend on it.
        const goal = await fetchCurrentGoal();
        displayCurrentGoal(); // We can display this immediately.

        // 2. Now, fetch the remaining data in parallel.
        const [nutritionData, weightDataResult] = await Promise.all([
            fetchTodayNutrition(),
            fetchWeightData()
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

        console.log('Dashboard data loaded successfully');

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show error state
        document.querySelectorAll('.target-value, .stat-value').forEach(el => {
            el.textContent = 'Error';
        });
        // Also clear the progress values
         document.querySelectorAll('.progress-header span:last-child').forEach(el => {
            el.textContent = 'Error';
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
  document.addEventListener('visibilitychange', () => {
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