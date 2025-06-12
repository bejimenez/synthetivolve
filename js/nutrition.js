document.addEventListener("DOMContentLoaded", () => {
  // --- SUPABASE SETUP & USER ID ---
  const SUPABASE_URL = "https://frhkplqsjpunezggymnp.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaGtwbHFzanB1bmV6Z2d5bW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTMzNTAsImV4cCI6MjA2NDc4OTM1MH0.PSLEbhiUGDTJNE3jaZueEHzORYAUqKL9IxBdmbm_HGg";
  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
  const YOUR_USER_ID = "415733cd-e674-455f-9688-78c8f7334ba8";

  // --- USDA FoodData Central API SETUP ---
  // Get your free API key at: https://fdc.nal.usda.gov/api-key-signup.html
  const USDA_API_KEY = "ifzDOdIg5l5N2pB5CF1h0ODjag0lSHd8V2Np27QN";
  const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

  console.log("Supabase client initialized.");

  // --- DOM REFERENCES ---
  const fabAddFoodBtn = document.getElementById("fab-add-food");
  const addFoodModal = document.getElementById("add-food-modal");
  const createFoodModal = document.getElementById("create-food-modal");
  const openCreateFoodModalBtn = document.getElementById(
    "open-create-food-modal-btn"
  );
  const modalCloseBtns = document.querySelectorAll(".modal-close-btn");
  const createFoodForm = document.getElementById("create-food-form");
  const logConfirmationSection = document.getElementById(
    "log-confirmation-section"
  );
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
  let usdaSearchCache = new Map(); // Cache to reduce API calls

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

  // --- EVENT LISTENERS ---
  fabAddFoodBtn.addEventListener("click", () => openModal(addFoodModal));
  openCreateFoodModalBtn.addEventListener("click", () => {
    closeModal(addFoodModal);
    openModal(createFoodModal);
  });
  modalCloseBtns.forEach((btn) =>
    btn.addEventListener(
      "click",
      () => btn.closest(".modal") && closeModal(btn.closest(".modal"))
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

      // Check cache first
      if (usdaSearchCache.has(searchTerm)) {
        displayUSDAResults(usdaSearchCache.get(searchTerm));
        return;
      }

      // USDA API search request
      const searchData = {
        query: searchTerm,
        dataType: ["Foundation", "SR Legacy", "Branded"], // All data types for comprehensive results
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

        // Cache the results
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
        // Show data type for clarity
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
        const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}&format=full`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to get food details: ${response.status}`);
        }

        const foodData = await response.json();

        // The transform function now returns an object with two properties:
        // { basic: { ... }, extended: { ... } }
        const { basic: foodToInsert, extended: extendedNutritionData } =
          await transformUSDAData(foodData);

        // --- STEP 1: Insert into the 'foods' table ---
        // We use .select().single() to immediately get the new food's data, including its generated 'id'
        const { data: newFood, error: foodError } = await supabase
          .from("foods")
          .insert(foodToInsert)
          .select()
          .single();

        if (foodError) {
          // Check for unique constraint violation (food already exists)
          if (foodError.code === "23505") {
            alert("This food already exists in your database.");
            // Optionally, you could fetch the existing food and proceed
          } else {
            console.error("Error saving food to DB:", foodError);
            alert("Could not save this food to your database.");
          }
          e.target.textContent = foodName; // Restore original text
          return;
        }

        console.log("Saved new food to 'foods' table:", newFood);

        // --- STEP 2: Insert into the 'extended_nutrition' table ---
        // Only proceed if there is extended data to save
        if (extendedNutritionData) {
          const { error: extError } = await supabase
            .from("extended_nutrition")
            .insert({
              ...extendedNutritionData,
              food_id: newFood.id, // Link to the food we just created
            });

          if (extError) {
            console.error("Error saving extended nutrition:", extError);
            // This is not critical, so we can just log it and continue
          } else {
            console.log("Saved extended nutrition data successfully.");
          }
        }

        selectedFoodForLogging = newFood;
        showLogConfirmation(selectedFoodForLogging);
      } catch (error) {
        console.error("Error processing USDA food:", error);
        alert("Could not retrieve nutrition information. Please try again.");
        e.target.textContent = foodName; // Restore original text
      }
    }
  });

  function showLogConfirmation(food) {
    selectedFoodName.textContent = food.name;
    logQuantityInput.value = food.serving_size_g || 100;
    logConfirmationSection.classList.remove("hidden");
  }

  async function transformUSDAData(usdaFood) {
    // Helper function to find nutrient by ID
    const findNutrient = (nutrientId) => {
      const nutrient = usdaFood.foodNutrients?.find(
        (n) => n.nutrient.id === nutrientId
      );
      return nutrient ? nutrient.amount : 0;
    };

    // Determine serving size - USDA uses 100g standard
    let servingSize = 100;
    if (usdaFood.foodPortions && usdaFood.foodPortions.length > 0) {
      // Use the first portion as default serving
      const portion = usdaFood.foodPortions[0];
      servingSize = portion.gramWeight || 100;
    }

    // Determine processing level based on data type and ingredients
    let processingLevel = 3; // default
    if (usdaFood.dataType === "Foundation") {
      processingLevel = 1; // Whole foods
    } else if (usdaFood.dataType === "SR Legacy") {
      processingLevel = 2; // Generic foods, often minimally processed
    } else if (usdaFood.dataType === "Branded") {
      // For branded foods, estimate based on ingredients count
      const ingredientCount = usdaFood.ingredients
        ? usdaFood.ingredients.split(",").length
        : 0;
      if (ingredientCount > 10) processingLevel = 5;
      else if (ingredientCount > 5) processingLevel = 4;
      else processingLevel = 3;
    }

    // Basic nutrition data for your main foods table
    const basicNutrition = {
      name: usdaFood.description,
      brand_name: usdaFood.brandName || usdaFood.brandOwner || null,
      creator_id: YOUR_USER_ID,
      serving_size_g: servingSize,
      calories: Math.round(findNutrient(208)), // Energy (kcal)
      protein_g: findNutrient(203), // Protein
      carbs_g: findNutrient(205), // Carbohydrate, by difference
      fat_g: findNutrient(204), // Total lipid (fat)
      fiber_g: findNutrient(291), // Fiber, total dietary
      sodium_mg: findNutrient(307), // Sodium
      processing_level: processingLevel,
      external_id: usdaFood.fdcId.toString(),
      external_source: "usda_fdc",
      data_type: usdaFood.dataType,
      // Store UPC if available for future barcode scanning
      barcode_upc: usdaFood.gtinUpc || null,
    };

    // Extended nutrition data (consider creating a separate table for this)
    const extendedNutrition = {
      // Carbohydrate details
      sugar_g: findNutrient(269), // Sugars, total
      added_sugar_g: findNutrient(539), // Sugars, added
      starch_g: findNutrient(209), // Starch

      // Fat details
      saturated_fat_g: findNutrient(606), // Fatty acids, total saturated
      monounsaturated_fat_g: findNutrient(645), // Fatty acids, total monounsaturated
      polyunsaturated_fat_g: findNutrient(646), // Fatty acids, total polyunsaturated
      trans_fat_g: findNutrient(605), // Fatty acids, total trans
      omega3_g: findNutrient(851) + findNutrient(852) + findNutrient(853), // EPA + DPA + DHA
      omega6_g: findNutrient(618) + findNutrient(619), // LA + ALA

      // Minerals (in mg unless specified)
      calcium_mg: findNutrient(301),
      iron_mg: findNutrient(303),
      magnesium_mg: findNutrient(304),
      phosphorus_mg: findNutrient(305),
      potassium_mg: findNutrient(306),
      zinc_mg: findNutrient(309),
      copper_mg: findNutrient(312),
      manganese_mg: findNutrient(315),
      selenium_ug: findNutrient(317), // in micrograms

      // Vitamins
      vitamin_a_ug: findNutrient(320), // Vitamin A, RAE
      vitamin_c_mg: findNutrient(401),
      vitamin_d_ug: findNutrient(328), // Vitamin D (D2 + D3)
      vitamin_e_mg: findNutrient(323), // Vitamin E (alpha-tocopherol)
      vitamin_k_ug: findNutrient(430), // Vitamin K (phylloquinone)
      thiamin_mg: findNutrient(404), // B1
      riboflavin_mg: findNutrient(405), // B2
      niacin_mg: findNutrient(406), // B3
      vitamin_b6_mg: findNutrient(415),
      folate_ug: findNutrient(417) + findNutrient(431), // Folate, DFE + Folic acid
      vitamin_b12_ug: findNutrient(418),
      pantothenic_acid_mg: findNutrient(410), // B5
      choline_mg: findNutrient(421),

      // Amino acids (essential) in grams
      tryptophan_g: findNutrient(501),
      threonine_g: findNutrient(502),
      isoleucine_g: findNutrient(503),
      leucine_g: findNutrient(504),
      lysine_g: findNutrient(505),
      methionine_g: findNutrient(506),
      phenylalanine_g: findNutrient(508),
      valine_g: findNutrient(510),
      histidine_g: findNutrient(512),

      // Other important compounds
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

  // Barcode scanning function using USDA
  async function searchByBarcode(barcode) {
    // USDA search by UPC/GTIN
    const searchData = {
      query: barcode,
      dataType: ["Branded"], // Barcodes are typically on branded products
      pageSize: 1,
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
        throw new Error(`Barcode search failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        // Verify the barcode matches
        if (food.gtinUpc === barcode) {
          // Get full nutrition data
          const detailResponse = await fetch(
            `${USDA_BASE_URL}/food/${food.fdcId}?api_key=${USDA_API_KEY}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const detailData = await detailResponse.json();
          return transformUSDAData(detailData);
        }
      }

      throw new Error("Barcode not found in USDA database");
    } catch (error) {
      console.error("Error searching by barcode:", error);
      throw error;
    }
  }

  logFoodBtn.addEventListener("click", async () => {
    if (!selectedFoodForLogging) return;
    const quantityGrams = parseFloat(logQuantityInput.value);
    const quantityMultiplier =
      quantityGrams / (selectedFoodForLogging.serving_size_g || 100);

    const loggedEntry = {
      user_id: YOUR_USER_ID,
      food_id: selectedFoodForLogging.id,
      quantity: quantityMultiplier,
      logged_at: new Date().toISOString(),
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
      alert(`${selectedFoodForLogging.name} logged successfully!`);
      closeModal(addFoodModal);
      logConfirmationSection.classList.add("hidden");
      myFoodSearchInput.value = "";
      myFoodSearchResults.innerHTML = "";
      onlineSearchInput.value = "";
      onlineSearchResults.innerHTML = "";
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
});
