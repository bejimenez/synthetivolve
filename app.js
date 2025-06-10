document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References ---
  const form = document.getElementById("calorie-form");
  const heightUnitSelect = document.getElementById("height-unit");
  const heightInInput = document.getElementById("height-in");
  const goalSelect = document.getElementById("goal");
  const rateGroup = document.getElementById("rate-group");
  const weightUnitSelect = document.getElementById("weight-unit");
  const rateUnitSpan = document.getElementById("rate-unit");
  // **NEW**: Reference for the rate type dropdown
  const rateTypeSelect = document.getElementById("rate-type");
  const rateInput = document.getElementById("rate");
  const resultsContainer = document.getElementById("results-container");
  const resultsOutput = document.getElementById("results-output");

  // --- Event Listeners ---

  heightUnitSelect.addEventListener("change", () => {
    heightInInput.classList.toggle("hidden", heightUnitSelect.value !== "ft");
  });

  goalSelect.addEventListener("change", () => {
    rateGroup.classList.toggle("hidden", goalSelect.value === "maintain");
  });

  weightUnitSelect.addEventListener("change", () => {
    rateUnitSpan.textContent = weightUnitSelect.value;
  });

  // **NEW**: Change the rate unit/symbol when switching between fixed and percentage
  rateTypeSelect.addEventListener("change", () => {
    if (rateTypeSelect.value === "percentage") {
      rateUnitSpan.textContent = "%";
      rateInput.value = "0.75"; // A sensible default for percentage
    } else {
      rateUnitSpan.textContent = weightUnitSelect.value;
      rateInput.value = "0.5"; // A sensible default for fixed
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calculateAndDisplayResults();
  });

  // --- Calculation Logic ---

  function calculateAndDisplayResults() {
    // 1. Get User Inputs
    const sex = document.querySelector('input[name="sex"]:checked').value;
    const age = parseInt(document.getElementById("age").value);
    let weightInput = parseFloat(document.getElementById("weight").value);
    let height = parseFloat(document.getElementById("height").value);
    const weightUnit = document.getElementById("weight-unit").value;
    const heightUnit = document.getElementById("height-unit").value;
    const activityLevel = parseFloat(
      document.getElementById("activity-level").value
    );
    const goal = document.getElementById("goal").value;
    const rate = parseFloat(document.getElementById("rate").value);
    // **NEW**: Get the selected rate type
    const rateType = document.getElementById("rate-type").value;

    if (isNaN(age) || isNaN(weightInput) || isNaN(height)) {
      alert("Please fill in all required fields with valid numbers.");
      return;
    }

    // 2. Unit Conversion to Metric (kg, cm) & store both units
    let weightInKg = weightInput;
    let weightInLbs = weightInput * 2.20462;
    if (weightUnit === "lbs") {
      weightInKg = weightInput * 0.453592;
      weightInLbs = weightInput; // It was already in lbs
    }

    if (heightUnit === "ft") {
      const inches =
        parseFloat(document.getElementById("height-in").value) || 0;
      height = (height * 12 + inches) * 2.54;
    }

    // 3. Calculate BMR (Mifflin-St Jeor)
    let bmr;
    if (sex === "male") {
      bmr = 10 * weightInKg + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weightInKg + 6.25 * height - 5 * age - 161;
    }

    // 4. Calculate TDEE
    const tdee = bmr * activityLevel;

    // 5. Adjust Calories Based on Goal
    const caloriesPerKgFat = 7700;
    let weeklyCaloricAdjustment = 0;

    // **NEW**: Logic to handle both fixed and percentage-based rates
    if (goal === "lose" || goal === "gain") {
      let weeklyWeightChangeInKg = 0;

      if (rateType === "percentage") {
        // Calculate the weight change based on a percentage of total body weight
        weeklyWeightChangeInKg = weightInKg * (rate / 100);
      } else {
        // 'fixed'
        // Use the fixed rate, converting to kg if necessary
        weeklyWeightChangeInKg = weightUnit === "lbs" ? rate * 0.453592 : rate;
      }

      weeklyCaloricAdjustment = caloriesPerKgFat * weeklyWeightChangeInKg;

      if (goal === "lose") {
        weeklyCaloricAdjustment = -weeklyCaloricAdjustment;
      }
    }

    const dailyCaloricAdjustment = weeklyCaloricAdjustment / 7;
    let targetCalories = tdee + dailyCaloricAdjustment;

    // **NEW**: Implement the 1100 calorie safety floor
    let calorieFloorApplied = false;
    if (targetCalories < 1100) {
      targetCalories = 1100;
      calorieFloorApplied = true;
    }

    // 6. **NEW**: Calculate Macronutrients based on your personalized rules
    // Rule 1: Protein is 1g per lb of body weight
    const proteinGrams = Math.round(weightInLbs * 1);

    // Rule 2: Fat is fixed at a healthy level (e.g., 55g)
    const fatGrams = 55;

    // Rule 3: Carbohydrates are the remaining calories
    const caloriesFromProtein = proteinGrams * 4;
    const caloriesFromFat = fatGrams * 9;
    const remainingCaloriesForCarbs =
      targetCalories - caloriesFromProtein - caloriesFromFat;

    // Ensure carbs don't go below zero if protein/fat needs are very high
    const carbsGrams = Math.max(0, Math.round(remainingCaloriesForCarbs / 4));

    // 7. Display Results
    displayResults(
      {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams,
        goal: goal,
      },
      calorieFloorApplied
    ); // Pass the new flag to the display function
  }

  function displayResults(results, calorieFloorApplied) {
    // **NEW**: Add a warning message if the calorie floor was used
    let floorWarning = "";
    if (calorieFloorApplied) {
      floorWarning = `<p class="warning"><strong>Note:</strong> Your target calories have been adjusted up to a minimum of <strong>1100 kcal</strong> for safety.</p>`;
    }

    resultsOutput.innerHTML = `
            <p>Your Basal Metabolic Rate (BMR) is <strong>${
              results.bmr
            }</strong> calories.</p>
            <p>Your Maintenance Calories (TDEE) are approximately <strong>${
              results.tdee
            }</strong> calories per day.</p>
            ${floorWarning}
            <hr>
            <h3>To ${
              results.goal.charAt(0).toUpperCase() + results.goal.slice(1)
            } Weight:</h3>
            <p>Your target intake is <strong>${
              results.targetCalories
            }</strong> calories per day.</p>
            <h4>Personalized Macronutrient Split:</h4>
            <p>Protein: <strong>${
              results.protein
            }g</strong> (1g per lb of bodyweight)</p>
            <p>Fat: <strong>${
              results.fat
            }g</strong> (Fixed for hormonal health)</p>
            <p>Carbohydrates: <strong>${
              results.carbs
            }g</strong> (Remaining calories)</p>
        `;
    resultsContainer.classList.remove("hidden");
  }
});
