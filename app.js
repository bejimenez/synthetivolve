document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References (Simplified) ---
  const form = document.getElementById("calorie-form");
  const goalSelect = document.getElementById("goal");
  const rateGroup = document.getElementById("rate-group");
  const weightUnitSelect = document.getElementById("weight-unit");
  const rateUnitSpan = document.getElementById("rate-unit");
  const rateTypeSelect = document.getElementById("rate-type");
  const rateInput = document.getElementById("rate");
  const resultsContainer = document.getElementById("results-container");
  const resultsOutput = document.getElementById("results-output");

  // --- Event Listeners (Simplified) ---

  // Show/hide the rate of loss/gain input based on goal
  goalSelect.addEventListener("change", () => {
    rateGroup.classList.toggle("hidden", goalSelect.value === "maintain");
  });

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

  // --- Calculation Logic ---

  function calculateAndDisplayResults() {
    // 1. Get User Inputs & Hardcoded Values

    // **MODIFIED**: Hardcoded values for gender and height
    const gender = "female";
    const heightInCm = 160.02; // 63 inches is 160.02 cm

    const age = parseInt(document.getElementById("age").value);
    let weightInput = parseFloat(document.getElementById("weight").value);
    const weightUnit = document.getElementById("weight-unit").value;
    const activityLevel = parseFloat(
      document.getElementById("activity-level").value
    );
    const goal = document.getElementById("goal").value;
    const rate = parseFloat(document.getElementById("rate").value);
    const rateType = document.getElementById("rate-type").value;

    // 2. Input Validation (Simplified)
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
    // **MODIFIED**: Now directly uses the hardcoded 'gender' and 'heightInCm' variables
    let bmr;
    if (gender === "male") {
      // Kept logic in case you ever want to switch back
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
    } else {
      // female
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
    const remainingCaloriesForCarbs =
      targetCalories - caloriesFromProtein - caloriesFromFat;
    const carbsGrams = Math.max(0, Math.round(remainingCaloriesForCarbs / 4));

    // 9. Display Results
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
    );
  }

  function displayResults(results, calorieFloorApplied) {
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
