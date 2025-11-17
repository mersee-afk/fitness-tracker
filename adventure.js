// --- Basic gated login (client-side demo) ---
const loginForm = document.getElementById('loginForm');
const loginOverlay = document.getElementById('loginOverlay');
const appRoot = document.getElementById('app');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

function setAuthenticated(flag) {
  localStorage.setItem('yjr_auth', flag ? '1' : '');
  updateAuthUI();
}

function isAuthenticated() {
  return localStorage.getItem('yjr_auth') === '1';
}

function updateAuthUI() {
  if (isAuthenticated()) {
    loginOverlay.style.display = 'none';
    appRoot.setAttribute('aria-hidden','false');
  } else {
    loginOverlay.style.display = 'flex';
    appRoot.setAttribute('aria-hidden','true');
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  // Demo hardcoded credentials (explain in README during demo)
  if (u === 'admin' && p === '1234') {
    setAuthenticated(true);
    loginError.textContent = '';
    initApp(); // initialize app state
  } else {
    loginError.textContent = 'Invalid username or password';
  }
});

logoutBtn.addEventListener('click', () => {
  setAuthenticated(false);
});

// --- App logic & persistence ---
let exercises = JSON.parse(localStorage.getItem('yjr_exercises') || '[]');
let meals = JSON.parse(localStorage.getItem('yjr_meals') || '[]');
let goals = JSON.parse(localStorage.getItem('yjr_goals') || '{"cal":2000,"exercise":30}');

const exerciseList = document.getElementById('exerciseList');
const mealList = document.getElementById('mealList');
const goalDisplay = document.getElementById('goalDisplay');

function saveAll() {
  localStorage.setItem('yjr_exercises', JSON.stringify(exercises));
  localStorage.setItem('yjr_meals', JSON.stringify(meals));
  localStorage.setItem('yjr_goals', JSON.stringify(goals));
  updateCharts();
  renderLists();
}

function renderLists(){
  exerciseList.innerHTML = '';
  exercises.forEach((ex, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${ex.type}</strong> — ${ex.name}</div><div>${ex.minutes}m <button data-i="${idx}" class="del">✖</button></div>`;
    exerciseList.appendChild(li);
  });
  mealList.innerHTML = '';
  meals.forEach((m, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${m.name}</strong> — ${m.cal} cal</div><div>P:${m.protein}g <button data-i="${idx}" class="del">✖</button></div>`;
    mealList.appendChild(li);
  });

  // delete handlers
  document.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(btn.dataset.i);
      // decide whether deleting from meals or exercises by scanning lists
      if (i < exercises.length && btn.parentElement.parentElement.parentElement === exerciseList) {
        exercises.splice(i,1);
      } else {
        // compute correct index for meals
        // fallback: try to remove from meals if present
        const mIndex = Array.from(mealList.querySelectorAll('button')).indexOf(btn);
        if (mIndex >= 0) meals.splice(mIndex,1);
      }
      saveAll();
    });
  });

  goalDisplay.textContent = `Daily target: ${goals.cal} cal • ${goals.exercise} min`;
}

// forms
document.getElementById('exerciseForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const type = document.getElementById('exerciseType').value;
  const name = document.getElementById('exerciseName').value.trim();
  const minutes = Number(document.getElementById('exerciseMinutes').value);
  if (!type || !name || !minutes) return;
  exercises.push({type,name,minutes,ts: Date.now()});
  saveAll();
  e.target.reset();
});

document.getElementById('mealForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = document.getElementById('mealName').value.trim();
  const cal = Number(document.getElementById('mealCalories').value);
  const protein = Number(document.getElementById('mealProtein').value);
  if (!name || isNaN(cal)) return;
  meals.push({name,cal,protein,ts: Date.now()});
  saveAll();
  e.target.reset();
});

document.getElementById('goalForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const cal = Number(document.getElementById('goalCalories').value);
  const exercise = Number(document.getElementById('goalExercise').value);
  if (isNaN(cal) || isNaN(exercise)) return;
  goals = {cal, exercise};
  saveAll();
  e.target.reset();
});

// --- Charts setup ---
const calCtx = document.getElementById('calorieChart').getContext('2d');
const exCtx = document.getElementById('exerciseChart').getContext('2d');

let calorieChart = new Chart(calCtx, {
  type: 'doughnut',
  data: {
    labels: ['Consumed','Remaining'],
    datasets: [{ data: [0,1], backgroundColor: ['#ff6384','#36a2eb'] }]
  },
  options: { responsive:true, plugins:{legend:{position:'bottom'}}}
});

let exerciseChart = new Chart(exCtx, {
  type: 'bar',
  data: { labels:['Today'], datasets:[{ label:'Minutes', data:[0], backgroundColor:'#4caf50' }] },
  options:{responsive:true, plugins:{legend:{display:false}}}
});

function aggregateToday() {
  // For demo simplicity we treat ALL saved data as today's data.
  const totalCalories = meals.reduce((s,m)=>s + (m.cal||0), 0);
  const totalExercise = exercises.reduce((s,e)=>s + (e.minutes||0), 0);
  return {totalCalories, totalExercise};
}

function updateCharts(){
  const { totalCalories, totalExercise } = aggregateToday();
  let remaining = Math.max(0, (goals.cal || 2000) - totalCalories);
  calorieChart.data.datasets[0].data = [totalCalories, remaining || 0];
  calorieChart.update();
  exerciseChart.data.datasets[0].data = [totalExercise];
  exerciseChart.update();
}

function initApp(){
  // load defaults if empty
  if (!goals || !goals.cal) goals = {cal:2000, exercise:30};
  // sync UI
  document.getElementById('goalCalories').value = goals.cal;
  document.getElementById('goalExercise').value = goals.exercise;
  renderLists();
  updateCharts();
}

// on load
updateAuthUI();
if (isAuthenticated()) initApp();