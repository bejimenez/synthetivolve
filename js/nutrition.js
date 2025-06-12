document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  if (!window.APP_CONFIG) {
    console.error("Configuration not loaded. Please check that config.js is included before nutrition.js");
    alert("Configuration error. Please check console.");
    return;
  }

  // --- SUPABASE SETUP & USER ID ---
  const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const YOUR_USER_ID = window.APP_CONFIG.USER_ID;

  // --- USDA FoodData Central API SETUP ---
  const USDA_API_KEY = window.APP_CONFIG.USDA_API_KEY;
  const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

  console.log("Supabase client initialized.");

  // --- STATE MANAGEMENT ---
  let currentDate = new Date();
  let todaysEntries = [];
  let foodsCache = new Map(); // Cache food details to reduce DB calls

  // --- DOM REFERENCES ---
  const timelineContainer = document.getElementById("timeline-container");
  const currentDateDisplay = document.getElementById("current-date");
  const prevDayBtn = document.getElementById("prev-day-btn");
  const nextDayBtn = document.getElementById("next-day-btn");
  const totalCaloriesDisplay = document.getElementById("total-calories");
  const totalProteinDisplay = document.getElementById("total-protein");
  const totalCarbsDisplay = document.getElementById("total-carbs");
  const totalFatDisplay = document.getElementById("total-fat");
  
  const fabAddFoodBtn = document.getElementById("fab-add-food");
  const addFoodModal = document.getElementById("add-food-modal");
  const createFoodModal = document.getElementById("create-food-modal");
  const openCreateFoodModalBtn = document.getElementById("open-create-food-modal-btn");
  const modalCloseBtns = document.querySelectorAll(".modal-close-btn");
  const createFoodForm = document.getElementById("create-food-form");
  const logConfirmationSection = document.getElementById("log-confirmation-section");
  const selectedFoodName = document.getElementById("selected-food-name");
  const logQuantityInput = document.getElementById("log-quantity-input");
  const logFoodBtn = document.getElementById("log-food-btn");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const myFoodSearchInput = document.getElementById("my-food-search-input");
  const myFoodSearchResults = document.getElementById("my-food-search-results");
  const onlineSearchInput = document.getElementById("online-search-input");
  const onlineSearchResults = document.getElementById("online-search-results");

  let selectedFoodForLogging = null;
  let selectedHourForLogging = null;
  let usdaSearchCache = new Map();

  // --- HELPER FUNCTIONS ---
  const openModal = (modal) => modal.classList.remove("hidden");
  const closeModal = (modal) => modal.classList.add("hidden");

  function debounce(func, delay = 500) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function getDateBounds(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // --- TIMELINE GENERATION ---
  function generateTimeline() {
    timelineContainer.innerHTML = "";
    
    // Generate blocks for each hour from 6 AM to 11 PM
    for (let hour = 6; hour <= 23; hour++) {
      const timeBlock = document.createElement("div");
      timeBlock.className = "time-block";
      timeBlock.dataset.hour = hour;
      
      const hourDisplay = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const amPm = hour < 12 ? "AM" : "PM";
      
      timeBlock.innerHTML = `
        <div class="time-header">
          <h3>${hourDisplay}:00 ${amPm}</h3>
          <button class="add-food-btn-sm" title="Add food to this hour" data-hour="${hour}">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="food-list" id="food-list-${hour}"></div>
      `;
      
      timelineContainer.appendChild(timeBlock);
    }
    
    // Add event listeners to all the small add buttons
    document.querySelectorAll('.add-food-btn-sm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        selectedHourForLogging = parseInt(e.currentTarget.dataset.hour);
        openModal(addFoodModal);
      });
    });
  }

  // --- DATA FETCHING ---
  async function fetchTodaysEntries() {
    const { start, end } = getDateBounds(currentDate);
    
    console.log('Fetching entries for date range:', start, 'to', end);
    
    const { data, error } = await supabase
      .from('logged_entries')
      .select('*')
      .eq('user_id', YOUR_USER_ID)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', end.toISOString())
      .order('logged_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching entries:', error);
      return;
    }
    
    todaysEntries = data || [];
    console.log('Fetched entries:', todaysEntries);
    
    // Fetch all unique foods for today's entries
    const uniqueFoodIds = [...new Set(todaysEntries.map(entry => entry.food_id))];
    const newFoodIds = uniqueFoodIds.filter(id => !foodsCache.has(id));
    
    console.log('Need to fetch foods:', newFoodIds);
    
    if (newFoodIds.length > 0) {
      const { data: foods, error: foodError } = await supabase
        .from('foods')
        .select('*')
        .in('id', newFoodIds);
      
      if (!foodError && foods) {
        console.log('Fetched foods:', foods);
        foods.forEach(food => foodsCache.set(food.id, food));
      } else if (foodError) {
        console.error('Error fetching foods:', foodError);
      }
    }
    
    console.log('Current foodsCache size:', foodsCache.size);
    
    displayEntries();
    calculateTotals();
  }

  // --- DISPLAY FUNCTIONS ---
  function displayEntries() {
    // Clear all food lists
    document.querySelectorAll('.food-list').forEach(list => list.innerHTML = '');
    
    // Group entries by hour
    const entriesByHour = {};
    todaysEntries.forEach(entry => {
      const hour = new Date(entry.logged_at).getHours();
      if (!entriesByHour[hour]) entriesByHour[hour] = [];
      entriesByHour[hour].push(entry);
    });
    
    // Display entries in their respective hours
    Object.entries(entriesByHour).forEach(([hour, entries]) => {
      const foodList = document.getElementById(`food-list-${hour}`);
      if (!foodList) return;
      
      entries.forEach(entry => {
        const food = foodsCache.get(entry.food_id);
        if (!food) return;
        
        const foodItem = document.createElement('div');
        foodItem.className = 'food-item';
        
        const calories = Math.round(food.calories * entry.quantity);
        const displayQuantity = Math.round(entry.quantity * (food.serving_size_g || 100));
        
        foodItem.innerHTML = `
          <div class="food-info">
            <span class="food-name">${food.name}</span>
            <span class="food-details">${displayQuantity}g • ${calories} cal</span>
          </div>
          <button class="delete-food-btn" data-entry-id="${entry.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        `;
        
        foodList.appendChild(foodItem);
      });
    });
    
    // Add delete event listeners
    document.querySelectorAll('.delete-food-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const entryId = e.currentTarget.dataset.entryId;
        if (confirm('Delete this entry?')) {
          await deleteEntry(entryId);
        }
      });
    });
  }

  function calculateTotals() {
    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
    
    console.log('Calculating totals for', todaysEntries.length, 'entries');
    
    todaysEntries.forEach(entry => {
      const food = foodsCache.get(entry.food_id);
      if (!food) {
        console.warn('Food not found in cache for entry:', entry);
        return;
      }
      
      // Debug: Log the actual food object
      console.log('Food object:', food);
      console.log('Entry quantity:', entry.quantity);
      
      // Check if the nutrition values exist and handle potential null/undefined
      const calories = (food.calories || 0) * entry.quantity;
      const protein = (food.protein_g || 0) * entry.quantity;
      const carbs = (food.carbs_g || 0) * entry.quantity;
      const fat = (food.fat_g || 0) * entry.quantity;
      
      // Log the calculation for debugging
      console.log('Adding food:', food.name, {
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat
      });
      
      totals.calories += calories;
      totals.protein += protein;
      totals.carbs += carbs;
      totals.fat += fat;
    });
    
    console.log('Final totals:', totals);
    
    totalCaloriesDisplay.textContent = Math.round(totals.calories);
    totalProteinDisplay.textContent = `${Math.round(totals.protein)}g`;
    totalCarbsDisplay.textContent = `${Math.round(totals.carbs)}g`;
    totalFatDisplay.textContent = `${Math.round(totals.fat)}g`;
  }

  async function deleteEntry(entryId) {
    const { error } = await supabase
      .from('logged_entries')
      .delete()
      .eq('id', entryId);
    
    if (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    } else {
      await fetchTodaysEntries();
    }
  }

  // --- DATE NAVIGATION ---
  function updateDateDisplay() {
    currentDateDisplay.textContent = formatDate(currentDate);
  }

  prevDayBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateDateDisplay();
    fetchTodaysEntries();
  });

  nextDayBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateDateDisplay();
    fetchTodaysEntries();
  });

  // --- EVENT LISTENERS ---
  fabAddFoodBtn.addEventListener("click", () => {
    selectedHourForLogging = new Date().getHours();
    openModal(addFoodModal);
  });
  
  openCreateFoodModalBtn.addEventListener("click", () => {
    closeModal(addFoodModal);
    openModal(createFoodModal);
  });
  
  modalCloseBtns.forEach((btn) =>
    btn.addEventListener("click", () => 
      btn.closest(".modal") && closeModal(btn.closest(".modal"))
    )
  );

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      tabContents.forEach((c) => c.classList.remove("active"));
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  // --- SEARCH LOGIC ---
  myFoodSearchInput.addEventListener(
    "input",
    debounce(async (e) => {
      const searchTerm = e.target.value.trim();
      if (searchTerm.length < 2) {
        myFoodSearchResults.innerHTML = "";
        return;
      }
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .ilike("name", `%${searchTerm}%`);
      if (error) {
        console.error("Error searching my foods:", error);
        return;
      }
      myFoodSearchResults.innerHTML = "";
      data.forEach((food) => {
        const li = document.createElement("li");
        li.textContent = food.name;
        li.dataset.food = JSON.stringify(food);
        myFoodSearchResults.appendChild(li);
      });
    })
  );

  onlineSearchInput.addEventListener(
    "input",
    debounce(async (e) => {
      const searchTerm = e.target.value.trim();
      if (searchTerm.length < 3) {
        onlineSearchResults.innerHTML = "";
        return;
      }

      if (usdaSearchCache.has(searchTerm)) {
        displayUSDAResults(usdaSearchCache.get(searchTerm));
        return;
      }

      const searchData = {
        query: searchTerm,
        dataType: ["Foundation", "SR Legacy", "Branded"],
        pageSize: 25,
        pageNumber: 1,
        sortBy: "dataType.keyword",
        sortOrder: "asc",
      };

      try {
        const response = await fetch(
          `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(searchData),
          }
        );

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        const data = await response.json();
        usdaSearchCache.set(searchTerm, data.foods);
        displayUSDAResults(data.foods);
      } catch (error) {
        console.error("Error fetching from USDA:", error);
        onlineSearchResults.innerHTML =
          "<li>Error fetching data. Please check your API key or try again.</li>";
      }
    })
  );

  function displayUSDAResults(foods) {
    onlineSearchResults.innerHTML = "";
    if (foods && foods.length > 0) {
      foods.forEach((food) => {
        const li = document.createElement("li");
        const dataTypeLabel =
          food.dataType === "Branded"
            ? " (Branded)"
            : food.dataType === "Foundation"
            ? " (Foundation)"
            : food.dataType === "SR Legacy"
            ? " (Generic)"
            : "";

        li.textContent = `${food.description}${dataTypeLabel}`;
        if (food.brandName) {
          li.textContent = `${food.description} - ${food.brandName}${dataTypeLabel}`;
        }
        li.dataset.fdcId = food.fdcId;
        li.dataset.foodName = food.description;
        li.dataset.dataType = food.dataType;
        onlineSearchResults.appendChild(li);
      });
    } else {
      onlineSearchResults.innerHTML = "<li>No results found.</li>";
    }
  }

  // --- DATA HANDLING ---
  myFoodSearchResults.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      selectedFoodForLogging = JSON.parse(e.target.dataset.food);
      showLogConfirmation(selectedFoodForLogging);
    }
  });

  onlineSearchResults.addEventListener("click", async (e) => {
    if (e.target.tagName === "LI") {
      const fdcId = e.target.dataset.fdcId;
      const foodName = e.target.dataset.foodName;

      e.target.textContent = "Loading comprehensive nutrition data...";

      try {
        const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}&format=full&nutrients=203,204,205,208,291,307`;
        console.log('Fetching USDA food details from:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to get food details: ${response.status}`);
        }

        const foodData = await response.json();
        console.log('USDA food data received:', foodData);
        const { basic: foodToInsert, extended: extendedNutritionData } =
          await transformUSDAData(foodData);

        const { data: newFood, error: foodError } = await supabase
          .from("foods")
          .insert(foodToInsert)
          .select()
          .single();

        if (foodError) {
          if (foodError.code === "23505") {
            alert("This food already exists in your database.");
          } else {
            console.error("Error saving food to DB:", foodError);
            alert("Could not save this food to your database.");
          }
          e.target.textContent = foodName;
          return;
        }

        console.log("Saved new food to 'foods' table:", newFood);

        if (extendedNutritionData) {
          const { error: extError } = await supabase
            .from("extended_nutrition")
            .insert({
              ...extendedNutritionData,
              food_id: newFood.id,
            });

          if (extError) {
            console.error("Error saving extended nutrition:", extError);
          } else {
            console.log("Saved extended nutrition data successfully.");
          }
        }

        selectedFoodForLogging = newFood;
        showLogConfirmation(selectedFoodForLogging);
      } catch (error) {
        console.error("Error processing USDA food:", error);
        alert("Could not retrieve nutrition information. Please try again.");
        e.target.textContent = foodName;
      }
    }
  });

  function showLogConfirmation(food) {
    selectedFoodName.textContent = food.name;
    logQuantityInput.value = food.serving_size_g || 100;
    logConfirmationSection.classList.remove("hidden");
  }

  async function transformUSDAData(usdaFood) {
    const findNutrient = (nutrientId) => {
      const nutrient = usdaFood.foodNutrients?.find(
        (n) => n.nutrient.id === nutrientId
      );
      return nutrient ? nutrient.amount : 0;
    };

    let servingSize = 100;
    if (usdaFood.foodPortions && usdaFood.foodPortions.length > 0) {
      const portion = usdaFood.foodPortions[0];
      servingSize = portion.gramWeight || 100;
    }

    let processingLevel = 3;
    if (usdaFood.dataType === "Foundation") {
      processingLevel = 1;
    } else if (usdaFood.dataType === "SR Legacy") {
      processingLevel = 2;
    } else if (usdaFood.dataType === "Branded") {
      const ingredientCount = usdaFood.ingredients
        ? usdaFood.ingredients.split(",").length
        : 0;
      if (ingredientCount > 10) processingLevel = 5;
      else if (ingredientCount > 5) processingLevel = 4;
      else processingLevel = 3;
    }

    const basicNutrition = {
      name: usdaFood.description,
      brand_name: usdaFood.brandName || usdaFood.brandOwner || null,
      creator_id: YOUR_USER_ID,
      serving_size_g: servingSize,
      calories: Math.round(findNutrient(208)),
      protein_g: findNutrient(203),
      carbs_g: findNutrient(205),
      fat_g: findNutrient(204),
      fiber_g: findNutrient(291),
      sodium_mg: findNutrient(307),
      processing_level: processingLevel,
      external_id: usdaFood.fdcId.toString(),
      external_source: "usda_fdc",
      data_type: usdaFood.dataType,
      barcode_upc: usdaFood.gtinUpc || null,
    };

    const extendedNutrition = {
      sugar_g: findNutrient(269),
      added_sugar_g: findNutrient(539),
      starch_g: findNutrient(209),
      saturated_fat_g: findNutrient(606),
      monounsaturated_fat_g: findNutrient(645),
      polyunsaturated_fat_g: findNutrient(646),
      trans_fat_g: findNutrient(605),
      omega3_g: findNutrient(851) + findNutrient(852) + findNutrient(853),
      omega6_g: findNutrient(618) + findNutrient(619),
      calcium_mg: findNutrient(301),
      iron_mg: findNutrient(303),
      magnesium_mg: findNutrient(304),
      phosphorus_mg: findNutrient(305),
      potassium_mg: findNutrient(306),
      zinc_mg: findNutrient(309),
      copper_mg: findNutrient(312),
      manganese_mg: findNutrient(315),
      selenium_ug: findNutrient(317),
      vitamin_a_ug: findNutrient(320),
      vitamin_c_mg: findNutrient(401),
      vitamin_d_ug: findNutrient(328),
      vitamin_e_mg: findNutrient(323),
      vitamin_k_ug: findNutrient(430),
      thiamin_mg: findNutrient(404),
      riboflavin_mg: findNutrient(405),
      niacin_mg: findNutrient(406),
      vitamin_b6_mg: findNutrient(415),
      folate_ug: findNutrient(417) + findNutrient(431),
      vitamin_b12_ug: findNutrient(418),
      pantothenic_acid_mg: findNutrient(410),
      choline_mg: findNutrient(421),
      tryptophan_g: findNutrient(501),
      threonine_g: findNutrient(502),
      isoleucine_g: findNutrient(503),
      leucine_g: findNutrient(504),
      lysine_g: findNutrient(505),
      methionine_g: findNutrient(506),
      phenylalanine_g: findNutrient(508),
      valine_g: findNutrient(510),
      histidine_g: findNutrient(512),
      cholesterol_mg: findNutrient(601),
      caffeine_mg: findNutrient(262),
      alcohol_g: findNutrient(221),
      water_g: findNutrient(255),
    };

    return {
      basic: basicNutrition,
      extended: extendedNutrition,
    };
  }

  logFoodBtn.addEventListener("click", async () => {
    if (!selectedFoodForLogging) return;
    const quantityGrams = parseFloat(logQuantityInput.value);
    const quantityMultiplier =
      quantityGrams / (selectedFoodForLogging.serving_size_g || 100);

    // Create a date with the selected hour
    const loggedDate = new Date(currentDate);
    loggedDate.setHours(selectedHourForLogging || new Date().getHours());
    loggedDate.setMinutes(0);
    loggedDate.setSeconds(0);

    const loggedEntry = {
      user_id: YOUR_USER_ID,
      food_id: selectedFoodForLogging.id,
      quantity: quantityMultiplier,
      logged_at: loggedDate.toISOString(),
    };
    
    const { data, error } = await supabase
      .from("logged_entries")
      .insert([loggedEntry])
      .select();
      
    if (error) {
      console.error("Error logging food:", error);
      alert("Failed to log food.");
    } else {
      console.log("Food logged successfully:", data);
      
      // IMPORTANT: Add the food to cache BEFORE fetching entries
      // This ensures the food data is available when displayEntries() runs
      if (!foodsCache.has(selectedFoodForLogging.id)) {
        foodsCache.set(selectedFoodForLogging.id, selectedFoodForLogging);
      }
      
      // Refresh the display - this will now find the food in the cache
      await fetchTodaysEntries();
      
      // Clean up and close modal
      closeModal(addFoodModal);
      logConfirmationSection.classList.add("hidden");
      myFoodSearchInput.value = "";
      myFoodSearchResults.innerHTML = "";
      onlineSearchInput.value = "";
      onlineSearchResults.innerHTML = "";
      selectedFoodForLogging = null;
      selectedHourForLogging = null;
    }
  });

  createFoodForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const foodData = {
      creator_id: YOUR_USER_ID,
      name: document.getElementById("food-name").value,
      serving_size_g: parseFloat(document.getElementById("food-serving").value),
      calories: parseFloat(document.getElementById("food-calories").value),
      protein_g: parseFloat(document.getElementById("food-protein").value),
      carbs_g: parseFloat(document.getElementById("food-carbs").value),
      fat_g: parseFloat(document.getElementById("food-fat").value),
      processing_level: parseInt(
        document.getElementById("food-processing").value
      ),
      external_source: "manual_entry",
    };
    const { data, error } = await supabase
      .from("foods")
      .insert([foodData])
      .select();
    if (error) {
      console.error("Error creating food:", error);
      alert("Failed to create food.");
    } else {
      console.log("Food created successfully:", data);
      alert(`${foodData.name} created successfully!`);
      createFoodForm.reset();
      closeModal(createFoodModal);
    }
  });

  // --- INITIALIZATION ---
  generateTimeline();
  updateDateDisplay();
  fetchTodaysEntries();
  
  // Refresh data every 30 seconds if the page is visible
  setInterval(() => {
    if (!document.hidden) {
      fetchTodaysEntries();
    }
  }, 30000);
});