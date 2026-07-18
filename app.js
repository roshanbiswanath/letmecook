/**
 * LetMeCook 🍳 - Main JavaScript Controller
 */

// Application State
const state = {
  apiKey: '',
  planData: null,
  currentTotalCost: 0,
  groceryPurchasedCosts: {}, // Maps grocery item index to its cost (if we need to buy it)
  timer: {
    intervalId: null,
    totalSeconds: 0,
    remainingSeconds: 0,
    isRunning: false,
    title: ''
  }
};

// DOM Elements
const elements = {
  // API settings
  apiKeyStatusContainer: document.getElementById('apiKeyStatusContainer'),
  statusIndicator: document.getElementById('statusIndicator'),
  statusText: document.getElementById('statusText'),
  toggleApiPanelBtn: document.getElementById('toggleApiPanelBtn'),
  apiSettingsPanel: document.getElementById('apiSettingsPanel'),
  closeApiPanelBtn: document.getElementById('closeApiPanelBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveKeyBtn: document.getElementById('saveKeyBtn'),
  clearKeyBtn: document.getElementById('clearKeyBtn'),
  
  // Sections
  setupSection: document.getElementById('setupSection'),
  loadingSection: document.getElementById('loadingSection'),
  dashboardSection: document.getElementById('dashboardSection'),
  
  // Form inputs
  plannerForm: document.getElementById('plannerForm'),
  dietPreference: document.getElementById('dietPreference'),
  budgetLimit: document.getElementById('budgetLimit'),
  servingSize: document.getElementById('servingSize'),
  fridgeIngredients: document.getElementById('fridgeIngredients'),
  generateBtn: document.getElementById('generateBtn'),
  loadingStageText: document.getElementById('loadingStageText'),
  loadingProgressBar: document.getElementById('loadingProgressBar'),
  
  // Dashboard UI
  backToSetupBtn: document.getElementById('backToSetupBtn'),
  printDashboardBtn: document.getElementById('printDashboardBtn'),
  mealsContainer: document.getElementById('mealsContainer'),
  groceryList: document.getElementById('groceryList'),
  totalCostDisplay: document.getElementById('totalCostDisplay'),
  budgetMeterPercent: document.getElementById('budgetMeterPercent'),
  budgetMeterBar: document.getElementById('budgetMeterBar'),
  budgetStatusBadge: document.getElementById('budgetStatusBadge'),
  subsList: document.getElementById('subsList'),
  todoContainer: document.getElementById('todoContainer'),
  checklistProgressText: document.getElementById('checklistProgressText'),
  checklistProgressFill: document.getElementById('checklistProgressFill'),
  
  // Timer Widget
  timerWidget: document.getElementById('timerWidget'),
  timerTitle: document.getElementById('timerTitle'),
  timerDisplay: document.getElementById('timerDisplay'),
  startTimerBtn: document.getElementById('startTimerBtn'),
  pauseTimerBtn: document.getElementById('pauseTimerBtn'),
  resetTimerBtn: document.getElementById('resetTimerBtn'),
  closeTimerBtn: document.getElementById('closeTimerBtn'),
  timerRingFill: document.getElementById('timerRingFill')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initLucide();
  loadApiKey();
  setupEventListeners();
});

// Initialize Lucide Icons helper
function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * API Key Loading and Verification Flow
 */
async function loadApiKey() {
  setApiKeyStatus('loading', 'Checking API Key...');
  
  // 1. Try to fetch from .env
  try {
    const res = await fetch('/.env');
    if (res.ok) {
      const text = await res.text();
      const envKey = parseEnvForKey(text, 'GEMINI_API_KEY');
      if (envKey && envKey !== 'YOUR_GEMINI_API_KEY_HERE' && envKey.trim() !== '') {
        state.apiKey = envKey;
        elements.apiKeyInput.value = envKey;
        setApiKeyStatus('success', 'API Key Loaded (.env)');
        return;
      }
    }
  } catch (err) {
    console.log('No local .env file found or accessible. Falling back to localStorage.', err);
  }
  
  // 2. Try to fetch from localStorage
  const savedKey = localStorage.getItem('GEMINI_API_KEY');
  if (savedKey && savedKey.trim() !== '') {
    state.apiKey = savedKey;
    elements.apiKeyInput.value = savedKey;
    setApiKeyStatus('success', 'API Key Loaded (Saved)');
  } else {
    setApiKeyStatus('error', 'API Key Missing');
    elements.apiSettingsPanel.classList.remove('hidden'); // Show panel if key is missing
  }
}

// Parse text environment file contents for a specific key
function parseEnvForKey(envText, keyName) {
  const lines = envText.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#') || line === '') continue;
    const parts = line.split('=');
    if (parts[0].trim() === keyName) {
      // Rejoin in case the value itself has equal signs (like a base64 string or special key format)
      return parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return null;
}

// UI representation of Key Load status
function setApiKeyStatus(type, message) {
  elements.statusIndicator.className = `status-indicator ${type}`;
  elements.statusText.textContent = message;
  
  const icon = elements.statusIndicator.querySelector('i');
  if (icon) {
    let iconName = 'key-round';
    if (type === 'success') iconName = 'check';
    if (type === 'error') iconName = 'alert-circle';
    icon.setAttribute('data-lucide', iconName);
    initLucide();
  }
}

/**
 * Event Listeners Registration
 */
function setupEventListeners() {
  // API settings toggle
  elements.toggleApiPanelBtn.addEventListener('click', () => {
    elements.apiSettingsPanel.classList.toggle('hidden');
  });
  
  elements.closeApiPanelBtn.addEventListener('click', () => {
    elements.apiSettingsPanel.classList.add('hidden');
  });
  
  // Save manual API Key
  elements.saveKeyBtn.addEventListener('click', () => {
    const key = elements.apiKeyInput.value.trim();
    if (key) {
      state.apiKey = key;
      localStorage.setItem('GEMINI_API_KEY', key);
      setApiKeyStatus('success', 'API Key Saved');
      elements.apiSettingsPanel.classList.add('hidden');
    } else {
      alert('Please enter a valid API Key.');
    }
  });
  
  // Clear API Key
  elements.clearKeyBtn.addEventListener('click', () => {
    state.apiKey = '';
    elements.apiKeyInput.value = '';
    localStorage.removeItem('GEMINI_API_KEY');
    setApiKeyStatus('error', 'API Key Missing');
    alert('API Key cleared.');
  });
  
  // Form submission
  elements.plannerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.apiKey) {
      alert('API Key is required to generate a plan! Please configure your Gemini API Key in the settings panel.');
      elements.apiSettingsPanel.classList.remove('hidden');
      return;
    }
    generatePlan();
  });
  
  // Navigation back to setup
  elements.backToSetupBtn.addEventListener('click', () => {
    elements.dashboardSection.classList.add('hidden');
    elements.setupSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Printing
  elements.printDashboardBtn.addEventListener('click', () => {
    window.print();
  });
  
  // Timer Controls
  elements.startTimerBtn.addEventListener('click', startTimer);
  elements.pauseTimerBtn.addEventListener('click', pauseTimer);
  elements.resetTimerBtn.addEventListener('click', resetTimer);
  elements.closeTimerBtn.addEventListener('click', closeTimer);
}

/**
 * Meal Plan Generation flow (Gemini Integration)
 */
async function generatePlan() {
  // Collect inputs
  const pace = document.querySelector('input[name="pace"]:checked').value;
  const diet = elements.dietPreference.value;
  const budget = parseFloat(elements.budgetLimit.value);
  const servings = parseInt(elements.servingSize.value);
  const fridge = elements.fridgeIngredients.value.trim();
  
  // Collect equipment checkboxes
  const equipment = [];
  if (document.getElementById('equipStove').checked) equipment.push('Stove');
  if (document.getElementById('equipOven').checked) equipment.push('Oven');
  if (document.getElementById('equipMicrowave').checked) equipment.push('Microwave');
  if (document.getElementById('equipAirFryer').checked) equipment.push('Air Fryer');
  if (document.getElementById('equipBlender').checked) equipment.push('Blender');
  
  // Switch to Loading View
  elements.setupSection.classList.add('hidden');
  elements.loadingSection.classList.remove('hidden');
  updateProgress(10, 'Formulating daily schedule and diet constraints...');
  
  // Prompt construction
  const prompt = `Generate a cooking meal plan, grocery budget analysis, smart substitutions, and cooking to-do checklist for a single day based on these requirements:
  - Daily Pace/Schedule: "${pace}" (Relaxed = fancy/complex, Moderate = standard, Busy = quick/less than 20 min total preparation + cook time per meal).
  - Dietary Constraints: "${diet}"
  - Budget Limit: $${budget} (for all groceries for the day's meals)
  - Servings: ${servings} people
  - Kitchen Equipment Available: ${equipment.join(', ') || 'No electrical equipment'}
  - Pantry/Fridge ingredients to prioritize (use these to save budget!): "${fridge || 'None'}"
  
  IMPORTANT: Return the response strictly as a JSON object matching this exact schema:
  {
    "meals": {
      "breakfast": {
        "name": "Meal Name",
        "description": "Short appetizing description",
        "prepTime": "e.g., 5 min",
        "cookTime": "e.g., 10 min",
        "equipment": ["Stove"]
      },
      "lunch": {
        "name": "Meal Name",
        "description": "Short appetizing description",
        "prepTime": "e.g., 10 min",
        "cookTime": "e.g., 15 min",
        "equipment": ["Microwave"]
      },
      "dinner": {
        "name": "Meal Name",
        "description": "Short appetizing description",
        "prepTime": "e.g., 15 min",
        "cookTime": "e.g., 20 min",
        "equipment": ["Oven", "Stove"]
      }
    },
    "groceries": [
      {
        "name": "Ingredient Name",
        "quantity": "e.g., 4 large eggs",
        "estimatedCost": 1.50
      }
    ],
    "budgetFeasibility": {
      "totalEstimatedCost": 18.75,
      "isFeasible": true,
      "statusMessage": "A short sentence comparing cost and limit (e.g., '$18.75 is well within your $25.00 budget.')",
      "advice": "Practical tips to reduce cost further (e.g., 'Swap fresh berries for frozen ones to save $2.00')"
    },
    "substitutions": [
      {
        "type": "diet" | "budget",
        "original": "Original ingredient",
        "replacement": "Substituted ingredient",
        "saving": 0.50,
        "note": "Reason or guidance for swap (e.g., 'Replace whole milk with almond milk to keep it vegan' or 'Swap pine nuts for toasted sunflower seeds to save $3')"
      }
    ],
    "todoList": {
      "breakfast": [
        {
          "step": "Chop vegetables and whisk eggs.",
          "durationMinutes": 0
        },
        {
          "step": "Pour into pan and cook on stove for 5 minutes.",
          "durationMinutes": 5
        }
      ],
      "lunch": [
        {
          "step": "Brief instruction here...",
          "durationMinutes": 10
        }
      ],
      "dinner": [
        {
          "step": "Brief instruction here...",
          "durationMinutes": 15
        }
      ]
    }
  }

  Double check that estimatedCost values are numbers (not strings) and represent realistic costs for the requested serving size. Include realistic steps with durationMinutes for timer triggers.`;

  try {
    updateProgress(35, 'Contacting Gemini Chef Agent...');
    
    const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${state.apiKey}`;
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `HTTP status ${response.status}`);
    }

    updateProgress(75, 'Parsing structured recipes and budget calculations...');
    const result = await response.json();
    
    // Extract JSON response text
    let jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) {
      throw new Error("Empty response received from Gemini.");
    }
    
    // Parse the JSON
    state.planData = JSON.parse(jsonText.trim());
    
    updateProgress(95, 'Polishing cooking task list...');
    await new Promise(r => setTimeout(r, 600)); // Smooth animation pause
    
    // Render dashboard and switch view
    renderDashboard();
    
    elements.loadingSection.classList.add('hidden');
    elements.dashboardSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (err) {
    console.error('Plan Generation Error:', err);
    alert(`Failed to generate cooking plan: ${err.message}\n\nPlease check your internet connection, API Key status, and parameters, then try again.`);
    
    elements.loadingSection.classList.add('hidden');
    elements.setupSection.classList.remove('hidden');
  }
}

// Update progress bar in loading stage
function updateProgress(percentage, text) {
  elements.loadingProgressBar.style.width = `${percentage}%`;
  elements.loadingStageText.textContent = text;
}

/**
 * Rendering Logic
 */
function renderDashboard() {
  const data = state.planData;
  if (!data) return;
  
  // 1. Render Meals
  elements.mealsContainer.innerHTML = '';
  const mealKeys = ['breakfast', 'lunch', 'dinner'];
  mealKeys.forEach(key => {
    const meal = data.meals[key];
    if (!meal) return;
    
    const mealCard = document.createElement('div');
    mealCard.className = 'card glass-card meal-card';
    
    // Render equipment tags
    const equipTags = meal.equipment.map(eq => `
      <span class="meta-item">
        <i data-lucide="wrench"></i>
        <span>${eq}</span>
      </span>
    `).join('');
    
    mealCard.innerHTML = `
      <span class="meal-badge ${key}">${key}</span>
      <h4 class="meal-name">${meal.name}</h4>
      <p class="meal-desc">${meal.description}</p>
      <div class="meal-meta">
        <span class="meta-item">
          <i data-lucide="clock"></i>
          <span>Prep: ${meal.prepTime}</span>
        </span>
        <span class="meta-item">
          <i data-lucide="flame"></i>
          <span>Cook: ${meal.cookTime}</span>
        </span>
        ${equipTags}
      </div>
    `;
    elements.mealsContainer.appendChild(mealCard);
  });
  
  // 2. Render Grocery Checklist & Init Budget
  elements.groceryList.innerHTML = '';
  state.groceryPurchasedCosts = {};
  
  data.groceries.forEach((item, index) => {
    state.groceryPurchasedCosts[index] = item.estimatedCost;
    
    const li = document.createElement('li');
    li.className = 'grocery-item';
    li.innerHTML = `
      <label class="grocery-checkbox-label">
        <input type="checkbox" data-index="${index}">
        <span class="grocery-checkbox"></span>
        <span>${item.name} <span class="text-muted">(${item.quantity})</span></span>
      </label>
      <span class="grocery-price">$${item.estimatedCost.toFixed(2)}</span>
    `;
    
    // Listen for changes on grocery checkboxes
    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', (e) => {
      // If checked: user ALREADY HAS IT, so we don't purchase it (set purchase cost to 0)
      // If unchecked: user NEEDS TO BUY IT, so we add its cost back
      if (e.target.checked) {
        state.groceryPurchasedCosts[index] = 0;
      } else {
        state.groceryPurchasedCosts[index] = item.estimatedCost;
      }
      recalculateBudget();
    });
    
    elements.groceryList.appendChild(li);
  });
  
  recalculateBudget();
  
  // 3. Render Substitutions
  elements.subsList.innerHTML = '';
  if (data.substitutions && data.substitutions.length > 0) {
    data.substitutions.forEach(sub => {
      const div = document.createElement('div');
      div.className = 'sub-item';
      
      const badgeClass = sub.type === 'diet' ? 'diet' : 'budget';
      const badgeText = sub.type === 'diet' ? 'Diet Swap' : 'Budget Saver';
      const savingHtml = sub.saving > 0 ? `<span class="sub-saving">Save $${sub.saving.toFixed(2)}</span>` : '';
      
      div.innerHTML = `
        <div class="sub-header">
          <span class="sub-badge ${badgeClass}">${badgeText}</span>
          ${savingHtml}
        </div>
        <div class="sub-swap-box">
          <span class="sub-original">${sub.original}</span>
          <span class="sub-arrow">&rarr;</span>
          <span class="sub-replacement">${sub.replacement}</span>
        </div>
        <p class="sub-note">${sub.note}</p>
      `;
      elements.subsList.appendChild(div);
    });
  } else {
    elements.subsList.innerHTML = '<p class="text-muted text-center py-4">No suggestions needed. Your menu fits perfectly!</p>';
  }
  
  // 4. Render Cooking To-Do Checklist
  elements.todoContainer.innerHTML = '';
  let totalStepsCount = 0;
  
  mealKeys.forEach(mealKey => {
    const steps = data.todoList?.[mealKey] || [];
    if (steps.length === 0) return;
    
    const catDiv = document.createElement('div');
    catDiv.className = 'todo-category';
    
    const stepsListHtml = steps.map((stepObj, index) => {
      totalStepsCount++;
      const timerBtnHtml = stepObj.durationMinutes > 0 ? `
        <button class="btn-inline-timer" data-duration="${stepObj.durationMinutes}" data-step-text="${stepObj.step.replace(/"/g, '&quot;')}">
          <i data-lucide="timer"></i>
          <span>${stepObj.durationMinutes}m timer</span>
        </button>
      ` : '';
      
      return `
        <li class="todo-item">
          <label class="todo-label">
            <input type="checkbox" class="todo-checkbox-input">
            <span class="todo-checkbox"></span>
            <div class="todo-content">
              <span class="todo-text">${stepObj.step}</span>
              ${timerBtnHtml}
            </div>
          </label>
        </li>
      `;
    }).join('');
    
    catDiv.innerHTML = `
      <h4 class="todo-cat-title ${mealKey}">
        <i data-lucide="chef-hat"></i>
        <span>${mealKey.charAt(0).toUpperCase() + mealKey.slice(1)} Prep</span>
      </h4>
      <ul class="todo-list">
        ${stepsListHtml}
      </ul>
    `;
    elements.todoContainer.appendChild(catDiv);
  });
  
  // Attach listeners to todo check items
  const todoCheckboxes = elements.todoContainer.querySelectorAll('.todo-checkbox-input');
  todoCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateChecklistProgress);
  });
  
  // Attach listeners to inline timer triggers
  const timerButtons = elements.todoContainer.querySelectorAll('.btn-inline-timer');
  timerButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const duration = parseInt(btn.getAttribute('data-duration'));
      const text = btn.getAttribute('data-step-text');
      setupTimer(duration, text);
    });
  });
  
  updateChecklistProgress();
  initLucide();
}

/**
 * Interactive Budget Calculation Logic
 */
function recalculateBudget() {
  const budgetLimit = parseFloat(elements.budgetLimit.value);
  
  // Calculate total based on what we still need to purchase (not checked)
  let totalToSpend = 0;
  for (let idx in state.groceryPurchasedCosts) {
    totalToSpend += state.groceryPurchasedCosts[idx];
  }
  
  state.currentTotalCost = totalToSpend;
  elements.totalCostDisplay.textContent = `$${totalToSpend.toFixed(2)}`;
  
  // Update meter percentage
  const percent = Math.min(Math.round((totalToSpend / budgetLimit) * 100), 100);
  elements.budgetMeterPercent.textContent = `${percent}%`;
  elements.budgetMeterBar.style.width = `${percent}%`;
  
  // Update status badge design
  elements.budgetStatusBadge.className = 'budget-status-badge';
  
  if (totalToSpend <= budgetLimit) {
    elements.budgetMeterBar.style.backgroundColor = 'var(--color-green)';
    elements.budgetStatusBadge.classList.add('success');
    elements.budgetStatusBadge.innerHTML = `
      <i data-lucide="check-circle" class="icon-sm"></i>
      <div>
        <strong>Within Budget!</strong> Total spending ($${totalToSpend.toFixed(2)}) is below your $${budgetLimit.toFixed(2)} limit.
        <span class="budget-advice">${state.planData?.budgetFeasibility?.advice || 'Great ingredient utilization!'}</span>
      </div>
    `;
  } else {
    elements.budgetMeterBar.style.backgroundColor = 'var(--color-red)';
    elements.budgetStatusBadge.classList.add('warning');
    elements.budgetStatusBadge.innerHTML = `
      <i data-lucide="alert-triangle" class="icon-sm"></i>
      <div>
        <strong>Over Budget!</strong> Spending ($${totalToSpend.toFixed(2)}) exceeds your $${budgetLimit.toFixed(2)} limit by $${(totalToSpend - budgetLimit).toFixed(2)}.
        <span class="budget-advice">${state.planData?.budgetFeasibility?.advice || 'Try check-marking items you already have at home to drop cost!'}</span>
      </div>
    `;
  }
  initLucide();
}

/**
 * Checklist Progress logic
 */
function updateChecklistProgress() {
  const todoCheckboxes = elements.todoContainer.querySelectorAll('.todo-checkbox-input');
  const checkedCount = Array.from(todoCheckboxes).filter(cb => cb.checked).length;
  const totalCount = todoCheckboxes.length;
  
  elements.checklistProgressText.textContent = `${checkedCount} / ${totalCount} steps completed`;
  
  const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  elements.checklistProgressFill.style.width = `${percentage}%`;
}

/**
 * Countdown Timer Controller Logic
 */
function setupTimer(minutes, text) {
  // Clear any existing running timer interval
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
  }
  
  state.timer.totalSeconds = minutes * 60;
  state.timer.remainingSeconds = minutes * 60;
  state.timer.title = text;
  state.timer.isRunning = false;
  
  // UI setups
  elements.timerTitle.textContent = text;
  elements.timerDisplay.textContent = formatTime(state.timer.remainingSeconds);
  elements.timerRingFill.style.width = '100%';
  elements.timerWidget.classList.remove('hidden');
  elements.timerWidget.classList.remove('timer-alert');
  
  elements.startTimerBtn.classList.remove('hidden');
  elements.pauseTimerBtn.classList.add('hidden');
  
  initLucide();
}

function startTimer() {
  if (state.timer.isRunning) return;
  state.timer.isRunning = true;
  
  elements.startTimerBtn.classList.add('hidden');
  elements.pauseTimerBtn.classList.remove('hidden');
  
  state.timer.intervalId = setInterval(() => {
    state.timer.remainingSeconds--;
    
    // Update display
    elements.timerDisplay.textContent = formatTime(state.timer.remainingSeconds);
    
    // Update visual ring line
    const progressPercent = (state.timer.remainingSeconds / state.timer.totalSeconds) * 100;
    elements.timerRingFill.style.width = `${progressPercent}%`;
    
    if (state.timer.remainingSeconds <= 0) {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
      state.timer.isRunning = false;
      timerFinished();
    }
  }, 1000);
}

function pauseTimer() {
  if (!state.timer.isRunning) return;
  state.timer.isRunning = false;
  
  elements.startTimerBtn.classList.remove('hidden');
  elements.pauseTimerBtn.classList.add('hidden');
  
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
  }
}

function resetTimer() {
  pauseTimer();
  state.timer.remainingSeconds = state.timer.totalSeconds;
  elements.timerDisplay.textContent = formatTime(state.timer.remainingSeconds);
  elements.timerRingFill.style.width = '100%';
  elements.timerWidget.classList.remove('timer-alert');
}

function closeTimer() {
  pauseTimer();
  elements.timerWidget.classList.add('hidden');
}

function timerFinished() {
  elements.timerDisplay.textContent = "00:00";
  elements.timerWidget.classList.add('timer-alert');
  
  // Play alarms using Web Audio API synthesis
  playAlarm();
  
  // Visual flash effect
  let flashToggle = true;
  const flashInterval = setInterval(() => {
    if (!elements.timerWidget.classList.contains('hidden') && elements.timerWidget.classList.contains('timer-alert')) {
      elements.timerWidget.style.borderColor = flashToggle ? 'var(--color-red)' : 'var(--color-orange)';
      flashToggle = !flashToggle;
    } else {
      clearInterval(flashInterval);
      elements.timerWidget.style.borderColor = '';
    }
  }, 400);
}

// Utility to format seconds into MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
