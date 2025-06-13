document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION & SUPABASE SETUP ---
  if (!window.APP_CONFIG) {
    console.error("Configuration not loaded. Please check that config.js is included before calculator.js");
    alert("Configuration error. Please check console.");
    return;
  }

  const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const YOUR_USER_ID = window.APP_CONFIG.USER_ID;

  // --- DOM Element References ---
  const form = document.getElementById("calorie-form");
  const goalSelect = document.getElementById("goal");
  const rateGroup = document.getElementById("rate-group");
  const goalDurationGroup = document.getElementById("goal-duration-group");
  const durationGroup = document.getElementById("duration-group");
  const weightUnitSelect = document.getElementById("weight-unit");
  const rateUnitSpan = document.getElementById("rate-unit");
  const rateTypeSelect = document.getElementById("rate-type");
  const rateInput = document.getElementById("rate");
  const resultsContainer = document.getElementById("results-container");
  const resultsOutput = document.getElementById("results-output");
  const saveGoalSection = document.getElementById("save-goal-section");
  const saveGoalBtn = document.getElementById("save-goal-btn");
  const goalNameInput = document.getElementById("goal-name");
  const durationInput = document.getElementById("duration");
  const durationUnitSelect = document.getElementById("duration-unit");

  // Store the last calculation results
  let lastCalculationResults = null;
  let lastCalculationInputs = null;

  // --- Event Listeners ---

  // Show/hide rate and duration inputs based on goal
  goalSelect.addEventListener("change", () => {
    const goal = goalSelect.value;
    const isNotMaintain = goal !== "maintain";
    
    // Show/hide rate inputs only for lose/gain goals
    rateGroup.classList.toggle("hidden", !isNotMaintain);
    
    // Always show duration and goal name inputs for tracking purposes
    goalDurationGroup.classList.remove("hidden");
    durationGroup.classList.remove("hidden");
    
    // Auto-populate goal name based on selection
    if (goal === "maintain") {
      goalNameInput.value = "Maintenance Phase";
      durationInput.value = "4"; // Default 4 weeks for maintenance
      durationUnitSelect.value = "weeks";
    } else {
      const goalType = goal === "lose" ? "Cut" : "Bulk";
      const duration = durationInput.value || 12;
      const unit = durationUnitSelect.value === "weeks" ? "Week" : "Month";
      goalNameInput.value = `${duration} ${unit} ${goalType}`;
    }
  });

  // Update goal name when duration changes
  durationInput.addEventListener("input", updateGoalName);
  durationUnitSelect.addEventListener("change", updateGoalName);

  function updateGoalName() {
    const goal = goalSelect.value;
    if (goal === "maintain") {
      goalNameInput.value = "Maintenance Phase";
    } else {
      const goalType = goal === "lose" ? "Cut" : "Bulk";
      const duration = durationInput.value || 12;
      const unit = durationUnitSelect.value === "weeks" ? "Week" : "Month";
      const unitText = duration === "1" ? unit.slice(0, -1) : unit; // Remove 's' for singular
      goalNameInput.value = `${duration} ${unitText} ${goalType}`;
    }
  }

  // Update the unit for the rate (kg/lbs) when weight unit changes
  weightUnitSelect.addEventListener("change", () => {
    if (rateTypeSelect.value === "fixed") {
      rateUnitSpan.textContent = weightUnitSelect.value;
    }
  });

  // Change the rate unit/symbol when switching between fixed and percentage
  rateTypeSelect.addEventListener("change", () => {
    if (rateTypeSelect.value === "percentage") {
      rateUnitSpan.textContent = "%";
      rateInput.value = "0.7"; // A sensible default for percentage
    } else {
      rateUnitSpan.textContent = weightUnitSelect.value;
      rateInput.value = "1.0"; // A sensible default for fixed lbs/kg
    }
  });

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calculateAndDisplayResults();
  });

  // Handle save goal button
  saveGoalBtn.addEventListener("click", async () => {
    await saveGoalToDatabase();
  });

  // --- Calculation Logic ---

  function calculateAndDisplayResults() {
    // 1. Get User Inputs & Hardcoded Values
    const gender = "female";
    const heightInCm = 160.02; // 63 inches is 160.02 cm

    const age = parseInt(document.getElementById("age").value);
    let weightInput = parseFloat(document.getElementById("weight").value);
    const weightUnit = document.getElementById("weight-unit").value;
    const activityLevel = parseFloat(document.getElementById("activity-level").value);
    const goal = document.getElementById("goal").value;
    const rate = parseFloat(document.getElementById("rate").value);
    const rateType = document.getElementById("rate-type").value;

    // 2. Input Validation
    if (isNaN(age) || isNaN(weightInput)) {
      alert("Please fill in Age and Weight with valid numbers.");
      return;
    }

    // 3. Unit Conversion for Weight
    let weightInKg = weightInput;
    let weightInLbs = weightInput * 2.20462;
    if (weightUnit === "lbs") {
      weightInKg = weightInput * 0.453592;
      weightInLbs = weightInput;
    }

    // 4. Calculate BMR (Mifflin-St Jeor)
    let bmr;
    if (gender === "male") {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
    } else {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
    }

    // 5. Calculate TDEE
    const tdee = bmr * activityLevel;

    // 6. Adjust Calories Based on Goal
    const caloriesPerKgFat = 7700;
    let weeklyCaloricAdjustment = 0;

    if (goal === "lose" || goal === "gain") {
      let weeklyWeightChangeInKg = 0;
      if (rateType === "percentage") {
        weeklyWeightChangeInKg = weightInKg * (rate / 100);
      } else {
        weeklyWeightChangeInKg = weightUnit === "lbs" ? rate * 0.453592 : rate;
      }
      weeklyCaloricAdjustment = caloriesPerKgFat * weeklyWeightChangeInKg;
      if (goal === "lose") {
        weeklyCaloricAdjustment = -weeklyCaloricAdjustment;
      }
    }

    const dailyCaloricAdjustment = weeklyCaloricAdjustment / 7;
    let targetCalories = tdee + dailyCaloricAdjustment;

    // 7. Implement the 1100 calorie safety floor
    let calorieFloorApplied = false;
    if (targetCalories < 1100) {
      targetCalories = 1100;
      calorieFloorApplied = true;
    }

    // 8. Calculate Personalized Macronutrients
    const proteinGrams = Math.round(weightInLbs * 1);
    const fatGrams = 55;
    const caloriesFromProtein = proteinGrams * 4;
    const caloriesFromFat = fatGrams * 9;
    const remainingCaloriesForCarbs = targetCalories - caloriesFromProtein - caloriesFromFat;
    const carbsGrams = Math.max(0, Math.round(remainingCaloriesForCarbs / 4));

    // Store results and inputs for potential saving
    lastCalculationResults = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams,
      goal: goal,
    };

    lastCalculationInputs = {
      age,
      weight_lb: weightInLbs,
      weight_unit: weightUnit,
      activity_level: activityLevel,
      goal,
      rate,
      rate_type: rateType,
    };

    // 9. Display Results
    displayResults(lastCalculationResults, calorieFloorApplied);
  }

  function displayResults(results, calorieFloorApplied) {
    let floorWarning = "";
    if (calorieFloorApplied) {
      floorWarning = `<p class="warning"><strong>Note:</strong> Your target calories have been adjusted up to a minimum of <strong>1100 kcal</strong> for safety.</p>`;
    }

    resultsOutput.innerHTML = `
      <p>Your Basal Metabolic Rate (BMR) is <strong>${results.bmr}</strong> calories.</p>
      <p>Your Maintenance Calories (TDEE) are approximately <strong>${results.tdee}</strong> calories per day.</p>
      ${floorWarning}
      <hr>
      <h3>To ${results.goal.charAt(0).toUpperCase() + results.goal.slice(1)} Weight:</h3>
      <p>Your target intake is <strong>${results.targetCalories}</strong> calories per day.</p>
      <h4>Personalized Macronutrient Split:</h4>
      <p>Protein: <strong>${results.protein}g</strong> (1g per lb of bodyweight)</p>
      <p>Fat: <strong>${results.fat}g</strong> (Fixed for hormonal health)</p>
      <p>Carbohydrates: <strong>${results.carbs}g</strong> (Remaining calories)</p>
    `;
    
    resultsContainer.classList.remove("hidden");
    
    // FIXED: Always show save goal section for any goal type
    // This allows users to save maintenance goals too
    saveGoalSection.classList.remove("hidden");
    
    // Update goal name for maintenance goals
    if (results.goal === "maintain") {
      goalNameInput.value = "Maintenance Phase";
    }
  }

  // --- Goal Saving Logic ---
  
  async function saveGoalToDatabase() {
    if (!lastCalculationResults || !lastCalculationInputs) {
      alert("Please calculate your targets first.");
      return;
    }

    const goalName = goalNameInput.value.trim();
    
    // For maintenance goals, use default duration if not specified
    let duration, durationUnit;
    if (lastCalculationResults.goal === "maintain") {
      duration = 2; // Default 2 weeks for maintenance
      durationUnit = "weeks";
    } else {
      duration = parseInt(durationInput.value);
      durationUnit = durationUnitSelect.value;
    }

    if (!goalName) {
      alert("Please enter a goal name.");
      goalNameInput.focus();
      return;
    }

    if (!duration || duration < 1) {
      alert("Please enter a valid duration.");
      if (durationInput) durationInput.focus();
      return;
    }

    // Calculate duration in days
    const durationDays = durationUnit === "weeks" ? duration * 7 : duration * 30;
    
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);

    // First, deactivate any existing active goals
    const { error: deactivateError } = await supabase
      .from('nutrition_goals')
      .update({ is_active: false })
      .eq('user_id', YOUR_USER_ID)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating previous goals:', deactivateError);
      alert('Error saving goal. Please try again.');
      return;
    }

    // Prepare goal data
    const goalData = {
      user_id: YOUR_USER_ID,
      goal_name: goalName,
      goal_type: lastCalculationResults.goal,
      target_calories: lastCalculationResults.targetCalories,
      target_protein_g: lastCalculationResults.protein,
      target_carbs_g: lastCalculationResults.carbs,
      target_fat_g: lastCalculationResults.fat,
      start_date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      end_date: endDate.toISOString().split('T')[0],
      duration_days: durationDays,
      is_active: true,
      
      // Store calculation inputs for reference
      age: lastCalculationInputs.age,
      weight_lb: lastCalculationInputs.weight_lb,
      weight_unit: lastCalculationInputs.weight_unit,
      activity_level: lastCalculationInputs.activity_level,
      rate: lastCalculationInputs.rate || 0, // Default to 0 for maintenance
      rate_type: lastCalculationInputs.rate_type || 'fixed',
      bmr: lastCalculationResults.bmr,
      tdee: lastCalculationResults.tdee,
    };

    console.log('Saving goal data:', goalData);

    try {
      saveGoalBtn.textContent = 'Saving...';
      saveGoalBtn.disabled = true;

      const { data, error } = await supabase
        .from('nutrition_goals')
        .insert([goalData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Goal saved successfully:', data);
      alert(`Goal "${goalName}" saved successfully! Check your dashboard to track progress.`);
      
      // Reset form or redirect to dashboard
      if (confirm('Would you like to go to your dashboard now?')) {
        window.location.href = 'index.html';
      }

    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal. Please try again.');
    } finally {
      saveGoalBtn.textContent = 'Save Goal & Start Tracking';
      saveGoalBtn.disabled = false;
    }
  }
});