// synthetivolve/frontend/js/mesocycles.js

document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION & SUPABASE SETUP ---
  if (!window.APP_CONFIG) {
    console.error("Configuration not loaded. Please check that config.js is included before mesocycle.js");
    alert("Configuration error. Please check console.");
    return;
  }

  const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const YOUR_USER_ID = window.APP_CONFIG.USER_ID;

  // --- STATE MANAGEMENT ---
  let currentMesocycle = {
    name: '',
    duration_weeks: 8,
    start_date: null,
    days: []
  };
  let exercises = [];
  let selectedExercise = null;
  let targetMuscleGroup = null;
  let targetSessionId = null;

  // --- DOM REFERENCES ---
  const daysContainer = document.getElementById("days-container");
  const addDayBtn = document.getElementById("add-day-btn");
  const saveMesocycleBtn = document.getElementById("save-mesocycle-btn");
  const manageExercisesBtn = document.getElementById("manage-exercises-btn");
  const mesocycleNameInput = document.getElementById("mesocycle-name");
  const durationWeeksInput = document.getElementById("duration-weeks");
  const startDateInput = document.getElementById("start-date");
  
  // Modal elements
  const exerciseModal = document.getElementById("exercise-modal");
  const exerciseCreatorModal = document.getElementById("exercise-creator-modal");
  const modalCloseBtns = document.querySelectorAll(".modal-close-btn");
  const exerciseSearch = document.getElementById("exercise-search");
  const muscleFilter = document.getElementById("muscle-filter");
  const equipmentFilter = document.getElementById("equipment-filter");
  const exerciseList = document.getElementById("exercise-list");
  const exerciseDetails = document.getElementById("exercise-details");
  const selectedExerciseName = document.getElementById("selected-exercise-name");
  const repTypeSelect = document.getElementById("rep-type");
  const addExerciseBtn = document.getElementById("add-exercise-btn");
  const createExerciseForm = document.getElementById("create-exercise-form");

  // --- INITIALIZATION ---
  loadExercises();
  initializeMesocycle();

  // --- EVENT LISTENERS ---
  addDayBtn.addEventListener("click", addNewDay);
  saveMesocycleBtn.addEventListener("click", saveMesocycle);
  manageExercisesBtn.addEventListener("click", () => openModal(exerciseCreatorModal));
  durationWeeksInput.addEventListener("change", updateDuration);
  mesocycleNameInput.addEventListener("input", (e) => currentMesocycle.name = e.target.value);
  startDateInput.addEventListener("change", (e) => currentMesocycle.start_date = e.target.value);
  
  // Modal controls
  modalCloseBtns.forEach(btn => btn.addEventListener("click", () => closeModal(btn.closest(".modal"))));
  exerciseSearch.addEventListener("input", filterExercises);
  muscleFilter.addEventListener("change", filterExercises);
  equipmentFilter.addEventListener("change", filterExercises);
  repTypeSelect.addEventListener("change", toggleRepInputs);
  addExerciseBtn.addEventListener("click", addExerciseToWorkout);
  createExerciseForm.addEventListener("submit", createNewExercise);

  // --- FUNCTIONS ---
  function initializeMesocycle() {
    // Create initial 4 days
    for (let i = 1; i <= 4; i++) {
      addNewDay();
    }
  }

  function addNewDay() {
    const dayNumber = currentMesocycle.days.length + 1;
    const dayData = {
      day_number: dayNumber,
      name: `Day ${dayNumber}`,
      is_rest_day: false,
      has_two_sessions: false,
      sessions: [{
        id: generateTempId(),
        type: 'main',
        muscle_groups: []
      }]
    };
    
    currentMesocycle.days.push(dayData);
    renderDay(dayData);
  }

  function renderDay(dayData) {
    const dayElement = document.createElement("div");
    dayElement.className = "mesocycle-day";
    dayElement.dataset.dayNumber = dayData.day_number;
    
    dayElement.innerHTML = `
      <div class="day-header">
        <div class="day-title">
          <input type="text" class="day-name-input" value="${dayData.name}" placeholder="Day ${dayData.day_number}">
          <button class="icon-btn drag-handle" title="Drag to reorder">
            <i class="fas fa-grip-vertical"></i>
          </button>
        </div>
        <div class="day-actions">
          <label class="toggle-label">
            <input type="checkbox" class="two-sessions-toggle" ${dayData.has_two_sessions ? 'checked' : ''}>
            <span>Two Sessions</span>
          </label>
          <button class="icon-btn delete-day-btn" title="Delete day">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="sessions-container">
        ${renderSession(dayData.sessions[0], 'Main Session')}
        ${dayData.has_two_sessions ? renderSession(dayData.sessions[1] || createNewSession('secondary'), 'Evening Session') : ''}
      </div>
    `;
    
    daysContainer.appendChild(dayElement);
    
    // Add event listeners
    const nameInput = dayElement.querySelector(".day-name-input");
    nameInput.addEventListener("input", (e) => dayData.name = e.target.value);
    
    const twoSessionsToggle = dayElement.querySelector(".two-sessions-toggle");
    twoSessionsToggle.addEventListener("change", (e) => {
      dayData.has_two_sessions = e.target.checked;
      if (e.target.checked && dayData.sessions.length === 1) {
        dayData.sessions.push(createNewSession('secondary'));
      }
      renderDays();
    });
    
    const deleteBtn = dayElement.querySelector(".delete-day-btn");
    deleteBtn.addEventListener("click", () => deleteDay(dayData.day_number));
    
    // Initialize sortable for muscle groups
    dayElement.querySelectorAll(".muscle-groups-container").forEach(container => {
      new Sortable(container, {
        group: 'muscle-groups',
        animation: 150,
        handle: '.muscle-group-header',
        onEnd: updateMesocycleState
      });
    });
  }

  function renderSession(session, title) {
    return `
      <div class="workout-session" data-session-id="${session.id}">
        <h4 class="session-title">${title}</h4>
        <div class="muscle-groups-container">
          ${session.muscle_groups.map(mg => renderMuscleGroup(mg)).join('')}
        </div>
        <button class="add-muscle-group-btn" onclick="window.addMuscleGroup('${session.id}')">
          <i class="fas fa-plus"></i> ADD A MUSCLE GROUP
        </button>
      </div>
    `;
  }

  function renderMuscleGroup(muscleGroup) {
    return `
      <div class="muscle-group" data-muscle-group-id="${muscleGroup.id}">
        <div class="muscle-group-header">
          <h5>${muscleGroup.name.toUpperCase()}</h5>
          <button class="icon-btn delete-muscle-group-btn" onclick="window.deleteMuscleGroup('${muscleGroup.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="exercises-list">
          ${muscleGroup.exercises.map(ex => renderExercise(ex)).join('')}
        </div>
      </div>
    `;
  }

  function renderExercise(exercise) {
    let detailsText = '';
    if (exercise.percentage_1rm) {
      detailsText = `${exercise.sets}×${exercise.reps || '?'} @ ${exercise.percentage_1rm}%`;
    } else if (exercise.reps_min && exercise.reps_max) {
      detailsText = `${exercise.sets}×${exercise.reps_min}-${exercise.reps_max}`;
    } else {
      detailsText = `${exercise.sets}×${exercise.reps || '?'}`;
    }
    
    if (exercise.rir !== null) {
      detailsText += ` RIR ${exercise.rir}`;
    }
    
    return `
      <div class="exercise-item" data-exercise-id="${exercise.id}">
        <span class="exercise-name">${exercise.name}</span>
        <span class="exercise-details">${detailsText}</span>
        <button class="icon-btn delete-exercise-btn" onclick="window.deleteExercise('${exercise.id}')">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }

  function createNewSession(type) {
    return {
      id: generateTempId(),
      type: type,
      muscle_groups: []
    };
  }

  function renderDays() {
    daysContainer.innerHTML = '';
    currentMesocycle.days.forEach(day => renderDay(day));
    
    // Initialize sortable for days
    new Sortable(daysContainer, {
      animation: 150,
      handle: '.drag-handle',
      onEnd: (evt) => {
        const item = currentMesocycle.days.splice(evt.oldIndex, 1)[0];
        currentMesocycle.days.splice(evt.newIndex, 0, item);
        updateDayNumbers();
      }
    });
  }

  function updateDayNumbers() {
    currentMesocycle.days.forEach((day, index) => {
      day.day_number = index + 1;
      if (!day.name || day.name.match(/^Day \d+$/)) {
        day.name = `Day ${index + 1}`;
      }
    });
    renderDays();
  }

  function deleteDay(dayNumber) {
    if (confirm("Are you sure you want to delete this day?")) {
      currentMesocycle.days = currentMesocycle.days.filter(d => d.day_number !== dayNumber);
      updateDayNumbers();
    }
  }

  function updateDuration() {
    currentMesocycle.duration_weeks = parseInt(durationWeeksInput.value);
  }

  // Exercise management functions
  async function loadExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', YOUR_USER_ID)
      .order('name');
    
    if (error) {
      console.error('Error loading exercises:', error);
      return;
    }
    
    exercises = data || [];
  }

  function filterExercises() {
    const searchTerm = exerciseSearch.value.toLowerCase();
    const muscleFilterValue = muscleFilter.value;
    const equipmentFilterValue = equipmentFilter.value;
    
    const filtered = exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchTerm);
      const matchesMuscle = !muscleFilterValue || ex.primary_muscle_group === muscleFilterValue;
      const matchesEquipment = !equipmentFilterValue || ex.equipment === equipmentFilterValue;
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
    
    displayExercises(filtered);
  }

  function displayExercises(exerciseList) {
    const listElement = document.getElementById("exercise-list");
    listElement.innerHTML = exerciseList.map(ex => `
      <div class="exercise-list-item" data-exercise-id="${ex.id}">
        <div class="exercise-info">
          <h4>${ex.name}</h4>
          <p>${ex.primary_muscle_group} • ${ex.equipment} • ${ex.movement_type}</p>
        </div>
        <button class="btn btn-sm" onclick="window.selectExercise('${ex.id}')">Select</button>
      </div>
    `).join('');
    
    if (exerciseList.length === 0) {
      listElement.innerHTML = `
        <div class="empty-state">
          <p>No exercises found</p>
          <button class="btn btn-secondary" onclick="window.openExerciseCreator()">
            <i class="fas fa-plus"></i> Create New Exercise
          </button>
        </div>
      `;
    }
  }

  function toggleRepInputs() {
    const repType = repTypeSelect.value;
    document.querySelectorAll('.rep-inputs').forEach(el => el.classList.add('hidden'));
    
    if (repType === 'range') {
      document.getElementById('rep-range-inputs').classList.remove('hidden');
    } else if (repType === 'fixed') {
      document.getElementById('fixed-reps-inputs').classList.remove('hidden');
    } else if (repType === 'percentage') {
      document.getElementById('percentage-inputs').classList.remove('hidden');
    }
  }

  async function createNewExercise(e) {
    e.preventDefault();
    
    const exerciseData = {
      user_id: YOUR_USER_ID,
      name: document.getElementById('new-exercise-name').value,
      primary_muscle_group: document.getElementById('primary-muscle').value,
      target_muscle: document.getElementById('target-muscle').value,
      secondary_muscles: document.getElementById('secondary-muscles').value
        .split(',').map(m => m.trim()).filter(m => m),
      movement_type: document.getElementById('movement-type').value,
      equipment: document.getElementById('equipment').value,
      unilateral: document.getElementById('unilateral').checked,
      force_type: document.getElementById('force-type').value || null,
      difficulty: document.getElementById('difficulty').value,
      notes: document.getElementById('exercise-notes').value || null
    };
    
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating exercise:', error);
      alert('Failed to create exercise');
      return;
    }
    
    exercises.push(data);
    alert(`Exercise "${data.name}" created successfully!`);
    createExerciseForm.reset();
    closeModal(exerciseCreatorModal);
    filterExercises();
  }

  function addExerciseToWorkout() {
    if (!selectedExercise || !targetMuscleGroup || !targetSessionId) return;
    
    const repType = repTypeSelect.value;
    const exerciseConfig = {
      id: generateTempId(),
      exercise_id: selectedExercise.id,
      name: selectedExercise.name,
      sets: parseInt(document.getElementById('sets-input').value),
      rir: parseInt(document.getElementById('rir-input').value) || null,
      rest_seconds: parseInt(document.getElementById('rest-input').value) || 120
    };
    
    if (repType === 'range') {
      exerciseConfig.reps_min = parseInt(document.getElementById('reps-min').value);
      exerciseConfig.reps_max = parseInt(document.getElementById('reps-max').value);
    } else if (repType === 'fixed') {
      exerciseConfig.reps = parseInt(document.getElementById('reps-fixed').value);
    } else if (repType === 'percentage') {
      exerciseConfig.percentage_1rm = parseFloat(document.getElementById('percentage-1rm').value);
      exerciseConfig.reps = parseInt(document.getElementById('reps-fixed').value) || null;
    }
    
    // Find the target session and muscle group
    let targetSession = null;
    let targetMuscleGroupObj = null;
    
    currentMesocycle.days.forEach(day => {
      day.sessions.forEach(session => {
        if (session.id === targetSessionId) {
          targetSession = session;
          targetMuscleGroupObj = session.muscle_groups.find(mg => mg.name === targetMuscleGroup);
          if (!targetMuscleGroupObj) {
            targetMuscleGroupObj = {
              id: generateTempId(),
              name: targetMuscleGroup,
              exercises: []
            };
            session.muscle_groups.push(targetMuscleGroupObj);
          }
        }
      });
    });
    
    if (targetMuscleGroupObj) {
      targetMuscleGroupObj.exercises.push(exerciseConfig);
      renderDays();
      closeModal(exerciseModal);
      resetExerciseModal();
    }
  }

  function resetExerciseModal() {
    selectedExercise = null;
    targetMuscleGroup = null;
    targetSessionId = null;
    exerciseDetails.classList.add('hidden');
    exerciseSearch.value = '';
    muscleFilter.value = '';
    equipmentFilter.value = '';
    filterExercises();
  }

  async function saveMesocycle() {
    if (!currentMesocycle.name) {
      alert('Please enter a mesocycle name');
      mesocycleNameInput.focus();
      return;
    }
    
    if (currentMesocycle.days.length === 0) {
      alert('Please add at least one training day');
      return;
    }
    
    saveMesocycleBtn.disabled = true;
    saveMesocycleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
      // Create the mesocycle
      const mesocycleData = {
        user_id: YOUR_USER_ID,
        name: currentMesocycle.name,
        duration_weeks: currentMesocycle.duration_weeks,
        start_date: currentMesocycle.start_date,
        status: 'draft'
      };
      
      if (mesocycleData.start_date) {
        const endDate = new Date(mesocycleData.start_date);
        endDate.setDate(endDate.getDate() + (mesocycleData.duration_weeks * 7) - 1);
        mesocycleData.end_date = endDate.toISOString().split('T')[0];
      }
      
      const { data: mesocycle, error: mesocycleError } = await supabase
        .from('mesocycles')
        .insert([mesocycleData])
        .select()
        .single();
      
      if (mesocycleError) throw mesocycleError;
      
      // Create days, sessions, and exercises
      for (const day of currentMesocycle.days) {
        const { data: dayData, error: dayError } = await supabase
          .from('mesocycle_days')
          .insert([{
            mesocycle_id: mesocycle.id,
            day_number: day.day_number,
            name: day.name,
            is_rest_day: day.is_rest_day,
            has_two_sessions: day.has_two_sessions
          }])
          .select()
          .single();
        
        if (dayError) throw dayError;
        
        // Create sessions
        for (const session of day.sessions) {
          const { data: sessionData, error: sessionError } = await supabase
            .from('workout_sessions')
            .insert([{
              mesocycle_day_id: dayData.id,
              session_type: session.type,
              name: session.name || null
            }])
            .select()
            .single();
          
          if (sessionError) throw sessionError;
          
          // Create exercises
          let orderIndex = 0;
          for (const muscleGroup of session.muscle_groups) {
            for (const exercise of muscleGroup.exercises) {
              const exerciseData = {
                workout_session_id: sessionData.id,
                exercise_id: exercise.exercise_id,
                order_index: orderIndex++,
                sets: exercise.sets,
                reps: exercise.reps || null,
                reps_min: exercise.reps_min || null,
                reps_max: exercise.reps_max || null,
                rir: exercise.rir || null,
                percentage_1rm: exercise.percentage_1rm || null,
                rest_seconds: exercise.rest_seconds || null
              };
              
              const { error: exerciseError } = await supabase
                .from('workout_exercises')
                .insert([exerciseData]);
              
              if (exerciseError) throw exerciseError;
            }
          }
        }
      }
      
      alert('Mesocycle saved successfully!');
      window.location.href = 'index.html';
      
    } catch (error) {
      console.error('Error saving mesocycle:', error);
      alert('Failed to save mesocycle. Please try again.');
    } finally {
      saveMesocycleBtn.disabled = false;
      saveMesocycleBtn.innerHTML = '<i class="fas fa-save"></i> Save Mesocycle';
    }
  }

  // Helper functions
  function generateTempId() {
    return 'temp-' + Math.random().toString(36).substr(2, 9);
  }

  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  function updateMesocycleState() {
    // This would update the state based on DOM changes
    // For now, we're maintaining state through direct manipulation
  }

  // Global functions for onclick handlers
  window.addMuscleGroup = (sessionId) => {
    const muscleGroups = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'ABS', 'CALVES'];
    const muscleGroup = prompt('Enter muscle group name:', 'CHEST');
    
    if (!muscleGroup) return;
    
    targetSessionId = sessionId;
    targetMuscleGroup = muscleGroup.toUpperCase();
    openModal(exerciseModal);
    filterExercises();
  };

  window.deleteMuscleGroup = (muscleGroupId) => {
    if (!confirm('Delete this muscle group and all its exercises?')) return;
    
    currentMesocycle.days.forEach(day => {
      day.sessions.forEach(session => {
        session.muscle_groups = session.muscle_groups.filter(mg => mg.id !== muscleGroupId);
      });
    });
    
    renderDays();
  };

  window.deleteExercise = (exerciseId) => {
    currentMesocycle.days.forEach(day => {
      day.sessions.forEach(session => {
        session.muscle_groups.forEach(mg => {
          mg.exercises = mg.exercises.filter(ex => ex.id !== exerciseId);
        });
      });
    });
    
    renderDays();
  };

  window.selectExercise = (exerciseId) => {
    selectedExercise = exercises.find(ex => ex.id === exerciseId);
    if (!selectedExercise) return;
    
    selectedExerciseName.textContent = selectedExercise.name;
    exerciseDetails.classList.remove('hidden');
    
    // Reset form to defaults
    document.getElementById('sets-input').value = 3;
    document.getElementById('rep-type').value = 'range';
    document.getElementById('reps-min').value = 8;
    document.getElementById('reps-max').value = 12;
    document.getElementById('rir-input').value = 2;
    document.getElementById('rest-input').value = 120;
    toggleRepInputs();
  };

  window.openExerciseCreator = () => {
    closeModal(exerciseModal);
    openModal(exerciseCreatorModal);
  };
});