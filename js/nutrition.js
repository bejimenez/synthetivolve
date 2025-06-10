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

      const apiUrl = `https://world.openfoodfacts.org/api/v3/search?search_terms=${searchTerm}&search_simple=1&action=process&json=1&page_size=20`;

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            // Per the documentation, identify your app. You can change the contact email.
            "User-Agent": "Synthetivolve/1.0 - (synthetivolve-app@example.com)",
          },
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        const data = await response.json();

        onlineSearchResults.innerHTML = "";
        if (data.products && data.products.length > 0) {
          data.products.forEach((product) => {
            if (
              product.product_name &&
              product.nutriments &&
              product.nutriments["energy-kcal_100g"]
            ) {
              const li = document.createElement("li");
              li.textContent = `${product.product_name} (${
                product.brands || "N/A"
              })`;
              li.dataset.product = JSON.stringify(product);
              onlineSearchResults.appendChild(li);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching from Open Food Facts:", error);
        onlineSearchResults.innerHTML =
          "<li>Error fetching data. Please try again.</li>";
      }
    })
  );

  // --- DATA HANDLING ---
  myFoodSearchResults.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      selectedFoodForLogging = JSON.parse(e.target.dataset.food);
      showLogConfirmation(selectedFoodForLogging);
    }
  });

  onlineSearchResults.addEventListener("click", async (e) => {
    if (e.target.tagName === "LI") {
      const product = JSON.parse(e.target.dataset.product);
      const foodToInsert = transformOFFData(product);
      const { data, error } = await supabase
        .from("foods")
        .insert(foodToInsert)
        .select()
        .single();
      if (error) {
        console.error("Error saving online food to DB:", error);
        alert("Could not save this food to your database.");
        return;
      }
      console.log("Saved new food from OFF to personal DB:", data);
      selectedFoodForLogging = data;
      showLogConfirmation(selectedFoodForLogging);
    }
  });

  function showLogConfirmation(food) {
    selectedFoodName.textContent = food.name;
    logQuantityInput.value = food.serving_size_g || 100;
    logConfirmationSection.classList.remove("hidden");
  }

  function transformOFFData(product) {
    const nutriments = product.nutriments;
    return {
      name: product.product_name,
      brand_name: product.brands || null,
      creator_id: YOUR_USER_ID,
      serving_size_g: 100,
      calories: nutriments["energy-kcal_100g"] || 0,
      protein_g: nutriments.proteins_100g || 0,
      carbs_g: nutriments.carbohydrates_100g || 0,
      fat_g: nutriments.fat_100g || 0,
      fiber_g: nutriments.fiber_100g || null,
      sodium_mg: nutriments.sodium_100g * 1000 || null,
      processing_level: product.nova_group || 3,
    };
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
