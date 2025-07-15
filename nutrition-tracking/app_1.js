// app.js - Fixed version with proper event handling
(() => {
  "use strict";

  // Configuration
  const HOURS = Array.from({ length: 18 }, (_, i) => i + 3);
  const CALORIE_GOAL = 2000;
  
  // Sample foods for demo
  const SAMPLE_FOODS = [
    { fdcId: 11090, description: "Banana, raw", calories: 89, protein: 1.09, fat: 0.33, carbs: 22.84, fiber: 2.6, sugar: 12.2, sodium: 1 },
    { fdcId: 171688, description: "Chicken breast, roasted", calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, sugar: 0, sodium: 74 },
    { fdcId: 176000, description: "Rice, white, cooked", calories: 130, protein: 2.4, fat: 0.2, carbs: 28, fiber: 0.4, sugar: 0.03, sodium: 1 },
    { fdcId: 12345, description: "Apple, raw", calories: 52, protein: 0.26, fat: 0.17, carbs: 13.81, fiber: 2.4, sugar: 10.39, sodium: 1 },
    { fdcId: 12346, description: "Orange, raw", calories: 47, protein: 0.94, fat: 0.12, carbs: 11.75, fiber: 2.4, sugar: 9.35, sodium: 0 },
    { fdcId: 12347, description: "Bread, whole wheat", calories: 247, protein: 13.35, fat: 4.17, carbs: 41.29, fiber: 6.8, sugar: 5.92, sodium: 428 }
  ];

  // Application state
  const state = {
    logs: {},
    recentFoods: new Map(),
    currentSlotHour: 12
  };

  // Utility functions
  const uuid = () => crypto.randomUUID();
  const todayKey = () => new Date().toISOString().slice(0, 10);
  const hourLabel = (h) => (h < 10 ? "0" + h : h) + ":00";

  // Toast notifications
  const showToast = (message, type = "success") => {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
  };

  // Navigation handling
  const switchPage = (pageName) => {
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    document.querySelector(`[data-page="${pageName}"]`).classList.add("active");
    
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    document.getElementById(`${pageName}-page`).classList.add("active");
    
    if (pageName === "overview") {
      setTimeout(updateOverviewCharts, 200);
    }
  };

  // Time slot rendering
  const renderTimeSlots = () => {
    const container = document.getElementById("time-slots");
    container.innerHTML = "";
    
    HOURS.forEach(hour => {
      const slot = document.createElement("div");
      slot.className = "hour-slot";
      slot.innerHTML = `
        <div class="hour-header">
          <span class="hour-label">${hourLabel(hour)}</span>
          <button class="add-btn" onclick="window.openAddDialog(${hour})">+</button>
        </div>
        <div class="foods-container" id="foods-${hour}"></div>
      `;
      container.appendChild(slot);
    });
  };

  const renderFoodsForSlot = (hour) => {
    const container = document.getElementById(`foods-${hour}`);
    if (!container) return;
    
    container.innerHTML = "";
    const logs = Object.values(state.logs).filter(l => l.slotHour === hour);
    
    logs.forEach(log => {
      const item = document.createElement("div");
      item.className = "food-item";
      item.innerHTML = `
        <span class="food-name">${log.description} (${log.quantity}${log.unit})</span>
        <span class="food-macros">${Math.round(log.nutrients.calories)} kcal</span>
      `;
      container.appendChild(item);
    });
  };

  // Daily summary update
  const updateDailySummary = () => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    Object.values(state.logs).forEach(log => {
      totals.calories += log.nutrients.calories;
      totals.protein += log.nutrients.protein;
      totals.carbs += log.nutrients.carbs;
      totals.fat += log.nutrients.fat;
    });

    document.getElementById("total-calories").textContent = Math.round(totals.calories);
    document.getElementById("total-protein").textContent = Math.round(totals.protein);
    document.getElementById("total-carbs").textContent = Math.round(totals.carbs);
    document.getElementById("total-fat").textContent = Math.round(totals.fat);

    const progress = Math.min(100, (totals.calories / CALORIE_GOAL) * 100);
    const progressBar = document.getElementById("calorie-progress");
    progressBar.style.width = progress + "%";
    
    if (totals.calories <= CALORIE_GOAL) {
      progressBar.style.background = "#16a34a";
    } else if (totals.calories <= CALORIE_GOAL * 1.1) {
      progressBar.style.background = "#ca8a04";
    } else {
      progressBar.style.background = "#dc2626";
    }
  };

  // Dialog management
  window.openAddDialog = (hour) => {
    state.currentSlotHour = hour;
    const dialog = document.getElementById("add-food-dialog");
    dialog.classList.add("active");
    
    // Reset to search tab
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.querySelector('[data-tab="search"]').classList.add("active");
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    document.getElementById("search-tab").classList.add("active");
    
    // Clear search
    document.getElementById("food-search").value = "";
    document.getElementById("search-results").innerHTML = "";
    
    // Load recent foods
    loadRecentFoods();
  };

  const closeAddDialog = () => {
    document.getElementById("add-food-dialog").classList.remove("active");
  };

  const closeFoodDetailsDialog = () => {
    document.getElementById("food-details-dialog").classList.remove("active");
  };

  // Search functionality
  let searchTimeout;
  const searchFoods = (query) => {
    const results = SAMPLE_FOODS.filter(food => 
      food.description.toLowerCase().includes(query.toLowerCase())
    );
    
    const container = document.getElementById("search-results");
    container.innerHTML = "";
    
    if (results.length === 0) {
      container.innerHTML = '<div class="search-result-item">No foods found</div>';
      return;
    }
    
    results.forEach(food => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.innerHTML = `
        <span>${food.description}</span>
        <span>${Math.round(food.calories)} kcal/100g</span>
      `;
      item.onclick = () => showFoodDetails(food);
      container.appendChild(item);
    });
  };

  const debouncedSearch = (query) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchFoods(query), 500);
  };

  // Recent foods
  const loadRecentFoods = () => {
    const container = document.getElementById("recent-foods");
    container.innerHTML = "";
    
    const recents = Array.from(state.recentFoods.values())
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 10);
    
    if (recents.length === 0) {
      container.innerHTML = '<div class="recent-food-item">No recent foods</div>';
      return;
    }
    
    recents.forEach(recent => {
      const food = SAMPLE_FOODS.find(f => f.fdcId === recent.fdcId);
      if (food) {
        const item = document.createElement("div");
        item.className = "recent-food-item";
        item.innerHTML = `
          <span>${food.description}</span>
          <span>Used ${recent.useCount} times</span>
        `;
        item.onclick = () => showFoodDetails(food);
        container.appendChild(item);
      }
    });
  };

  // Food details dialog
  const showFoodDetails = (food) => {
    document.getElementById("add-food-dialog").classList.remove("active");
    document.getElementById("food-details-dialog").classList.add("active");
    
    document.getElementById("food-details-title").textContent = food.description;
    document.getElementById("details-loading").style.display = "flex";
    document.getElementById("quantity-form").style.display = "none";
    
    setTimeout(() => {
      document.getElementById("food-details-content").innerHTML = `
        <p><strong>Per 100g:</strong></p>
        <ul>
          <li>Calories: ${food.calories}</li>
          <li>Protein: ${food.protein} g</li>
          <li>Fat: ${food.fat} g</li>
          <li>Carbs: ${food.carbs} g</li>
          <li>Fiber: ${food.fiber} g</li>
          <li>Sugar: ${food.sugar} g</li>
          <li>Sodium: ${food.sodium} mg</li>
        </ul>
      `;
      
      document.getElementById("details-loading").style.display = "none";
      document.getElementById("quantity-form").style.display = "block";
      
      // Reset form
      document.getElementById("food-quantity").value = "100";
      document.getElementById("food-unit").value = "g";
      
      // Store food data
      const dialog = document.getElementById("food-details-dialog");
      dialog.dataset.fdcId = food.fdcId;
      dialog.dataset.description = food.description;
      dialog.dataset.calories = food.calories;
      dialog.dataset.protein = food.protein;
      dialog.dataset.fat = food.fat;
      dialog.dataset.carbs = food.carbs;
      dialog.dataset.fiber = food.fiber;
      dialog.dataset.sugar = food.sugar;
      dialog.dataset.sodium = food.sodium;
    }, 300);
  };

  // Add food functionality
  const addFood = () => {
    const quantity = parseFloat(document.getElementById("food-quantity").value);
    const unit = document.getElementById("food-unit").value;
    
    if (!quantity || quantity <= 0) {
      showToast("Please enter a valid quantity", "error");
      return;
    }
    
    const dialog = document.getElementById("food-details-dialog");
    const fdcId = parseInt(dialog.dataset.fdcId);
    const description = dialog.dataset.description;
    
    const factor = quantity / 100;
    const nutrients = {
      calories: parseFloat(dialog.dataset.calories) * factor,
      protein: parseFloat(dialog.dataset.protein) * factor,
      fat: parseFloat(dialog.dataset.fat) * factor,
      carbs: parseFloat(dialog.dataset.carbs) * factor,
      fiber: parseFloat(dialog.dataset.fiber) * factor,
      sugar: parseFloat(dialog.dataset.sugar) * factor,
      sodium: parseFloat(dialog.dataset.sodium) * factor
    };
    
    const log = {
      id: uuid(),
      fdcId,
      description,
      quantity,
      unit,
      loggedAt: new Date().toISOString(),
      slotHour: state.currentSlotHour,
      nutrients
    };
    
    state.logs[log.id] = log;
    
    // Update recent foods
    const existing = state.recentFoods.get(fdcId) || {
      fdcId,
      description,
      useCount: 0,
      lastUsed: new Date().toISOString()
    };
    existing.useCount++;
    existing.lastUsed = new Date().toISOString();
    state.recentFoods.set(fdcId, existing);
    
    renderFoodsForSlot(state.currentSlotHour);
    updateDailySummary();
    closeFoodDetailsDialog();
    showToast(`Added ${description} to ${hourLabel(state.currentSlotHour)}`);
  };

  // Overview charts
  let macroChart, calorieChart;
  
  const updateOverviewCharts = () => {
    const logs = Object.values(state.logs);
    const totals = { protein: 0, fat: 0, carbs: 0 };
    const caloriesByFood = {};
    
    logs.forEach(log => {
      totals.protein += log.nutrients.protein;
      totals.fat += log.nutrients.fat;
      totals.carbs += log.nutrients.carbs;
      caloriesByFood[log.description] = (caloriesByFood[log.description] || 0) + log.nutrients.calories;
    });
    
    // Macro chart
    const macroCtx = document.getElementById("macroChart");
    if (macroCtx) {
      if (macroChart) macroChart.destroy();
      macroChart = new Chart(macroCtx, {
        type: "bar",
        data: {
          labels: ["Protein", "Fat", "Carbs"],
          datasets: [{
            label: "Grams",
            data: [Math.round(totals.protein), Math.round(totals.fat), Math.round(totals.carbs)],
            backgroundColor: ["#1FB8CD", "#FFC185", "#B4413C"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
    
    // Calorie chart
    const calorieCtx = document.getElementById("calorieChart");
    if (calorieCtx && Object.keys(caloriesByFood).length > 0) {
      if (calorieChart) calorieChart.destroy();
      calorieChart = new Chart(calorieCtx, {
        type: "pie",
        data: {
          labels: Object.keys(caloriesByFood),
          datasets: [{
            data: Object.values(caloriesByFood).map(v => Math.round(v)),
            backgroundColor: ["#1FB8CD", "#FFC185", "#B4413C", "#ECEBD5", "#5D878F"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
    
    // Update nutrient list
    const totalNutrients = {
      fiber: logs.reduce((sum, l) => sum + l.nutrients.fiber, 0),
      sugar: logs.reduce((sum, l) => sum + l.nutrients.sugar, 0),
      sodium: logs.reduce((sum, l) => sum + l.nutrients.sodium, 0)
    };
    
    document.getElementById("nutrient-list").innerHTML = `
      <div>Fiber: ${Math.round(totalNutrients.fiber)} g</div>
      <div>Sugar: ${Math.round(totalNutrients.sugar)} g</div>
      <div>Sodium: ${Math.round(totalNutrients.sodium)} mg</div>
    `;
  };

  // Barcode simulation
  window.simulateBarcodeScan = () => {
    showToast("Simulated barcode scan → Banana");
    switchPage('today');
    setTimeout(() => {
      window.openAddDialog(12);
      document.getElementById("food-search").value = "banana";
      debouncedSearch("banana");
    }, 200);
  };

  // Initialize sample data
  const initSampleData = () => {
    const sampleLogs = [
      { food: SAMPLE_FOODS[0], hour: 9, quantity: 120 },
      { food: SAMPLE_FOODS[1], hour: 8, quantity: 150 },
      { food: SAMPLE_FOODS[2], hour: 8, quantity: 80 }
    ];
    
    sampleLogs.forEach(({ food, hour, quantity }) => {
      const factor = quantity / 100;
      const nutrients = {
        calories: food.calories * factor,
        protein: food.protein * factor,
        fat: food.fat * factor,
        carbs: food.carbs * factor,
        fiber: food.fiber * factor,
        sugar: food.sugar * factor,
        sodium: food.sodium * factor
      };
      
      const log = {
        id: uuid(),
        fdcId: food.fdcId,
        description: food.description,
        quantity,
        unit: "g",
        loggedAt: new Date().toISOString(),
        slotHour: hour,
        nutrients
      };
      
      state.logs[log.id] = log;
      state.recentFoods.set(food.fdcId, {
        fdcId: food.fdcId,
        description: food.description,
        useCount: 1,
        lastUsed: new Date().toISOString()
      });
    });
  };

  // Event listeners
  const setupEventListeners = () => {
    // Navigation
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        switchPage(link.dataset.page);
      });
    });

    // Dialog close buttons
    document.getElementById("close-dialog").addEventListener("click", closeAddDialog);
    document.getElementById("close-food-details").addEventListener("click", closeFoodDetailsDialog);

    // Tab switching
    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
      });
    });

    // Search input
    document.getElementById("food-search").addEventListener("input", (e) => {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        debouncedSearch(query);
      } else {
        document.getElementById("search-results").innerHTML = "";
      }
    });

    // Add food button
    document.getElementById("add-food-btn").addEventListener("click", addFood);

    // Close dialogs on overlay click
    document.getElementById("add-food-dialog").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeAddDialog();
    });
    
    document.getElementById("food-details-dialog").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeFoodDetailsDialog();
    });
  };

  // Initialize app
  const init = () => {
    renderTimeSlots();
    initSampleData();
    setupEventListeners();
    
    HOURS.forEach(renderFoodsForSlot);
    updateDailySummary();
    
    console.log("Nutrition tracker initialized successfully");
  };

  // Start the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();