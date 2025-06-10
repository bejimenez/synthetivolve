document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References ---
  const form = document.getElementById("calorie-form");
  const heightUnitSelect = document.getElementById("height-unit");
  const heightInInput = document.getElementById("height-in");
  const goalSelect = document.getElementById("goal");
  const rateGroup = document.getElementById("rate-group");
  const weightUnitSelect = document.getElementById("weight-unit");
  const rateUnitSpan = document.getElementById("rate-unit");
  const resultsContainer = document.getElementById("results-container");
  const resultsOutput = document.getElementById("results-output");

  // --- Event Listeners ---

  // Show/hide feet/inches input based on height unit selection
  heightUnitSelect.addEventListener("change", () => {
    heightInInput.classList.toggle("hidden", heightUnitSelect.value !== "ft");
  });

  // Show/hide the rate of loss/gain input based on goal
  goalSelect.addEventListener("change", () => {
    rateGroup.classList.toggle("hidden", goalSelect.value === "maintain");
  });

  // Update the unit for the rate (kg/lbs) when weight unit changes
  weightUnitSelect.addEventListener("change", () => {
    rateUnitSpan.textContent = weightUnitSelect.value;
  });

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent page reload
    calculateAndDisplayResults();
  });

  // --- Calculation Logic ---

  function calculateAndDisplayResults() {
    // 1. Get User Inputs
    const sex = document.querySelector('input[name="sex"]:checked').value;
    const age = parseInt(document.getElementById("age").value);
    let weight = parseFloat(document.getElementById("weight").value);
    let height = parseFloat(document.getElementById("height").value);
    const weightUnit = document.getElementById("weight-unit").value;
    const heightUnit = document.getElementById("height-unit").value;
    const activityLevel = parseFloat(
      document.getElementById("activity-level").value
    );
    const goal = document.getElementById("goal").value;
    let rate = parseFloat(document.getElementById("rate").value);

    // 2. Input Validation
    if (isNaN(age) || isNaN(weight) || isNaN(height)) {
      alert("Please fill in all required fields with valid numbers.");
      return;
    }

    // 3. Unit Conversion to Metric (kg, cm)
    if (weightUnit === "lbs") {
      weight = weight * 0.453592; // lbs to kg
    }

    if (heightUnit === "ft") {
      const inches =
        parseFloat(document.getElementById("height-in").value) || 0;
      height = (height * 12 + inches) * 2.54; // ft/in to cm
    }

    // 4. Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor
    // Formula: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + s
    // (s is +5 for men, -161 for women)
    let bmr;
    if (sex === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      // female
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // 5. Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityLevel;

    // 6. Adjust Calories Based on Goal
    let targetCalories;
    const caloriesPerKgFat = 7700;
    let weeklyCaloricAdjustment = 0;

    // Convert rate to kg if it was entered in lbs
    if (weightUnit === "lbs") {
      rate = rate * 0.453592;
    }

    if (goal === "lose") {
      weeklyCaloricAdjustment = -(caloriesPerKgFat * rate);
    } else if (goal === "gain") {
      weeklyCaloricAdjustment = caloriesPerKgFat * rate;
    }

    const dailyCaloricAdjustment = weeklyCaloricAdjustment / 7;
    targetCalories = tdee + dailyCaloricAdjustment;

    // 7. Calculate Macronutrients (example split: 40% C, 30% P, 30% F)
    const proteinGrams = (targetCalories * 0.3) / 4;
    const carbsGrams = (targetCalories * 0.4) / 4;
    const fatGrams = (targetCalories * 0.3) / 9;

    // 8. Display Results
    displayResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      protein: Math.round(proteinGrams),
      carbs: Math.round(carbsGrams),
      fat: Math.round(fatGrams),
      goal: goal,
    });
  }

  function displayResults(results) {
    resultsOutput.innerHTML = `
            <p>Your Basal Metabolic Rate (BMR) is <strong>${
              results.bmr
            }</strong> calories.</p>
            <p>Your Maintenance Calories (TDEE) are approximately <strong>${
              results.tdee
            }</strong> calories per day.</p>
            <hr>
            <h3>To ${
              results.goal.charAt(0).toUpperCase() + results.goal.slice(1)
            } Weight:</h3>
            <p>Your target intake is <strong>${
              results.targetCalories
            }</strong> calories per day.</p>
            <h4>Suggested Macronutrient Split:</h4>
            <p>Protein: <strong>${results.protein}g</strong></p>
            <p>Carbohydrates: <strong>${results.carbs}g</strong></p>
            <p>Fat: <strong>${results.fat}g</strong></p>
        `;
    resultsContainer.classList.remove("hidden");
  }
});
