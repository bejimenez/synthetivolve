document.addEventListener("DOMContentLoaded", () => {
  // --- SUPABASE SETUP ---
  const SUPABASE_URL = "https://frhkplqsjpunezggymnp.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaGtwbHFzanB1bmV6Z2d5bW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTMzNTAsImV4cCI6MjA2NDc4OTM1MH0.PSLEbhiUGDTJNE3jaZueEHzORYAUqKL9IxBdmbm_HGg";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
  console.log("Supabase client initialized.");

  // --- SINGLE USER SETUP ---
  const YOUR_USER_ID = "415733cd-e674-455f-9688-78c8f7334ba8";

  // --- DOM ELEMENT REFERENCES ---
  const fabAddFoodBtn = document.getElementById("fab-add-food");
  const addFoodModal = document.getElementById("add-food-modal");
  const createFoodModal = document.getElementById("create-food-modal");
  const openCreateFoodModalBtn = document.getElementById(
    "open-create-food-modal-btn"
  );
  const modalCloseBtns = document.querySelectorAll(".modal-close-btn");
  const createFoodForm = document.getElementById("create-food-form");
  const searchInput = document.getElementById("food-search-input");
  const searchResults = document.getElementById("food-search-results");
  const logConfirmationSection = document.getElementById(
    "log-confirmation-section"
  );
  const selectedFoodName = document.getElementById("selected-food-name");
  const logQuantityInput = document.getElementById("log-quantity-input");
  const logFoodBtn = document.getElementById("log-food-btn");

  let selectedFoodForLogging = null;

  // --- HELPER FUNCTIONS ---
  const openModal = (modal) => modal.classList.remove("hidden");
  const closeModal = (modal) => modal.classList.add("hidden");

  // --- EVENT LISTENERS ---

  fabAddFoodBtn.addEventListener("click", () => openModal(addFoodModal));

  openCreateFoodModalBtn.addEventListener("click", () => {
    closeModal(addFoodModal);
    openModal(createFoodModal);
  });

  // --- THIS IS THE CORRECTED CODE BLOCK ---
  // Close any modal using a more robust method
  modalCloseBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Find the closest parent element with the class '.modal' and close it.
      const modal = btn.closest(".modal");
      if (modal) {
        closeModal(modal);
      }
    });
  });

  // Handle "Create New Food" form submission
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
      alert("Failed to create food. Check the console for details.");
    } else {
      console.log("Food created successfully:", data);
      alert(`${foodData.name} created successfully!`);
      createFoodForm.reset();
      closeModal(createFoodModal);
    }
  });

  // Handle food search
  searchInput.addEventListener("input", async (e) => {
    const searchTerm = e.target.value.trim();
    if (searchTerm.length < 3) {
      searchResults.innerHTML = "";
      return;
    }

    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .ilike("name", `%${searchTerm}%`);

    if (error) {
      console.error("Error searching food:", error);
      return;
    }

    searchResults.innerHTML = "";
    data.forEach((food) => {
      const li = document.createElement("li");
      li.textContent = food.name;
      li.dataset.food = JSON.stringify(food);
      searchResults.appendChild(li);
    });
  });

  // Handle clicking a search result
  searchResults.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      selectedFoodForLogging = JSON.parse(e.target.dataset.food);
      selectedFoodName.textContent = selectedFoodForLogging.name;
      logQuantityInput.value = selectedFoodForLogging.serving_size_g;
      logConfirmationSection.classList.remove("hidden");
    }
  });

  // Handle final "Log This Food" button click
  logFoodBtn.addEventListener("click", async () => {
    if (!selectedFoodForLogging) return;

    const quantityGrams = parseFloat(logQuantityInput.value);
    const quantityMultiplier =
      quantityGrams / selectedFoodForLogging.serving_size_g;

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
      alert("Failed to log food. Check the console for details.");
    } else {
      console.log("Food logged successfully:", data);
      alert(`${selectedFoodForLogging.name} logged successfully!`);
      closeModal(addFoodModal);
      logConfirmationSection.classList.add("hidden");
      searchInput.value = "";
      searchResults.innerHTML = "";
    }
  });

  // --- INITIALIZATION ---
  function renderDay(date) {
    console.log("Rendering day:", date);
  }

  renderDay(new Date());
});
