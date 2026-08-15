const STORAGE_KEY = "gymProgressApp.v1";

const defaultExercises = [
  {id:"bench", name:"Bankdrukken", muscle:"Borst", sets:3, min:8, max:10, increment:2.5, start:30},
  {id:"dbpress", name:"Dumbbell Drukken", muscle:"Borst", sets:3, min:8, max:12, increment:2, start:null},
  {id:"dbfly", name:"Dumbbell Fly", muscle:"Borst", sets:3, min:10, max:15, increment:2, start:null},
  {id:"tricepspush", name:"Triceps Pushdown", muscle:"Triceps", sets:3, min:10, max:15, increment:2.5, start:null},
  {id:"tricepsext", name:"Triceps Extension", muscle:"Triceps", sets:3, min:10, max:15, increment:2, start:null},
  {id:"plank", name:"Plank", muscle:"Core", sets:3, min:30, max:60, increment:5, start:null, unit:"sec"},
  {id:"deadbug", name:"Deadbug", muscle:"Core", sets:3, min:8, max:12, increment:0, start:null},

  {id:"pullup", name:"Optrekken", muscle:"Rug", sets:3, min:5, max:10, increment:2.5, start:0},
  {id:"pulldown", name:"Lat Pulldown", muscle:"Rug", sets:3, min:8, max:12, increment:5, start:null},
  {id:"row", name:"Seated Row", muscle:"Rug", sets:3, min:8, max:12, increment:5, start:null},
  {id:"facepull", name:"Face Pull", muscle:"Schouders/Rug", sets:3, min:12, max:15, increment:2.5, start:null},
  {id:"dbcurl", name:"Dumbbell Curl", muscle:"Biceps", sets:3, min:10, max:12, increment:2, start:null},
  {id:"hammercurl", name:"Hammer Curl", muscle:"Biceps", sets:3, min:10, max:12, increment:2, start:null},
  {id:"ezcurl", name:"Ez-bar Curl", muscle:"Biceps", sets:3, min:8, max:12, increment:2.5, start:null},
  {id:"hangingknees", name:"Hangend Knieën Optrekken", muscle:"Core", sets:3, min:8, max:15, increment:0, start:null},

  {id:"legpress", name:"Leg Press", muscle:"Benen", sets:3, min:10, max:12, increment:10, start:null},
  {id:"hipthrust", name:"Hip Thrust", muscle:"Billen/Benen", sets:3, min:8, max:12, increment:5, start:null},
  {id:"legext", name:"Leg Extension", muscle:"Benen", sets:3, min:10, max:15, increment:5, start:null},
  {id:"legcurl", name:"Leg Curl", muscle:"Benen", sets:3, min:10, max:15, increment:5, start:null},
  {id:"shoulderpress", name:"Schouderdrukken", muscle:"Schouders", sets:3, min:8, max:12, increment:2, start:null},
  {id:"sideraise", name:"Side Raise", muscle:"Schouders", sets:3, min:12, max:15, increment:2, start:null}
];

const defaultRoutines = {
  A: {
    name:"Workout A - Borst Tricep",
    exercises:["bench","dbpress","dbfly","tricepspush","tricepsext","plank","deadbug"]
  },
  B: {
    name:"Workout B - Rug Bicep",
    exercises:["pullup","pulldown","row","facepull","dbcurl","hammercurl","ezcurl","hangingknees","plank"]
  },
  C: {
    name:"Workout C - Benen Schouders",
    exercises:["legpress","hipthrust","legext","legcurl","shoulderpress","sideraise","facepull","deadbug","plank"]
  }
}

let state = loadState();
if(!state.routines) state.routines = defaultRoutines;
// Voeg nieuwere standaard-oefeningen toe zonder bestaande voortgang te wissen.
for(const ex of defaultExercises){
  if(!state.exercises.some(x=>x.id===ex.id)) state.exercises.push(ex);
}
saveState();
let activeWorkout = null;
let restTimer = {
  duration: 90,
  remaining: 90,
  interval: null,
  running: false,
  finished: false
};



function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {exercises: defaultExercises, routines: defaultRoutines, workouts: [], body: []};
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function fmtKg(v){ return (v===null || v==="" || typeof v==="undefined") ? "—" : `${Number(v).toFixed(Number(v)%1?1:0)} kg`; }
function localDate(iso){ return new Date(iso).toLocaleDateString("nl-NL",{day:"2-digit",month:"2-digit",year:"numeric"}); }
function nowISO(){ return new Date().toISOString(); }
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }

function getExercise(id){ return state.exercises.find(x=>x.id===id); }
function workoutsFor(id){ return state.workouts.filter(w=>w.exerciseId===id).sort((a,b)=>new Date(a.date)-new Date(b.date)); }
function suggestedWeight(ex){
  const items = workoutsFor(ex.id);
  if(!items.length) return ex.start ?? null;
  return items[items.length-1].nextWeight;
}

const workoutDaySelect = document.getElementById("workoutDaySelect");
const exerciseSelect = document.getElementById("exerciseSelect");
const targetLabel = document.getElementById("targetLabel");
const suggestedWeightEl = document.getElementById("suggestedWeight");
const incrementLabel = document.getElementById("incrementLabel");
const weightInput = document.getElementById("weightInput");
const setsContainer = document.getElementById("setsContainer");
const rirInput = document.getElementById("rirInput");
const noteInput = document.getElementById("noteInput");
const resultBox = document.getElementById("resultBox");

const manageWorkoutBtn = document.getElementById("manageWorkoutBtn");
const workoutManagerDialog = document.getElementById("workoutManagerDialog");
const workoutManagerTitle = document.getElementById("workoutManagerTitle");
const workoutExerciseChecklist = document.getElementById("workoutExerciseChecklist");


const startWorkoutBtn = document.getElementById("startWorkoutBtn");
const activeWorkoutName = document.getElementById("activeWorkoutName");
const activeExerciseSelect = document.getElementById("activeExerciseSelect");
const activeExerciseName = document.getElementById("activeExerciseName");
const activeCounter = document.getElementById("activeCounter");
const activeProgressBar = document.getElementById("activeProgressBar");
const previousWeight = document.getElementById("previousWeight");
const previousReps = document.getElementById("previousReps");
const activeTarget = document.getElementById("activeTarget");
const activeSuggested = document.getElementById("activeSuggested");
const activeIncrement = document.getElementById("activeIncrement");
const activeWeightInput = document.getElementById("activeWeightInput");
const activeSetsContainer = document.getElementById("activeSetsContainer");
const activeRirInput = document.getElementById("activeRirInput");
const activeNoteInput = document.getElementById("activeNoteInput");
const activeResultBox = document.getElementById("activeResultBox");

const restTimerDisplay = document.getElementById("restTimerDisplay");
const restTimerStatus = document.getElementById("restTimerStatus");
const restTimerStartBtn = document.getElementById("restTimerStartBtn");
const restTimerResetBtn = document.getElementById("restTimerResetBtn");



document.getElementById("todayDate").textContent = new Date().toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"});



function formatTimerSeconds(total){
  const s=Math.max(0,Math.floor(total));
  const m=Math.floor(s/60);
  const sec=s%60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function renderRestTimer(){
  if(!restTimerDisplay) return;
  restTimerDisplay.textContent=formatTimerSeconds(restTimer.remaining);
  restTimerStartBtn.textContent=restTimer.running ? "Pauze" : (restTimer.finished ? "Opnieuw" : "Start rust");
  restTimerStatus.className="timer-status";
  if(restTimer.running){
    restTimerStatus.textContent="Loopt";
    restTimerStatus.classList.add("running");
  }else if(restTimer.finished){
    restTimerStatus.textContent="Klaar ✓";
    restTimerStatus.classList.add("done");
  }else{
    restTimerStatus.textContent="Klaar";
  }
  document.querySelectorAll(".timer-preset").forEach(btn=>{
    btn.classList.toggle("active",Number(btn.dataset.seconds)===Number(restTimer.duration));
  });
}

function stopRestTimerInterval(){
  if(restTimer.interval){
    clearInterval(restTimer.interval);
    restTimer.interval=null;
  }
  restTimer.running=false;
}

function setRestTimer(seconds, autoStart=false){
  stopRestTimerInterval();
  restTimer.duration=Number(seconds);
  restTimer.remaining=Number(seconds);
  restTimer.finished=false;
  renderRestTimer();
  if(autoStart) startRestTimer();
}

function startRestTimer(){
  if(restTimer.running){
    stopRestTimerInterval();
    renderRestTimer();
    return;
  }
  if(restTimer.finished || restTimer.remaining<=0){
    restTimer.remaining=restTimer.duration;
    restTimer.finished=false;
  }
  restTimer.running=true;
  renderRestTimer();

  restTimer.interval=setInterval(()=>{
    restTimer.remaining-=1;
    if(restTimer.remaining<=0){
      restTimer.remaining=0;
      stopRestTimerInterval();
      restTimer.finished=true;
      renderRestTimer();
      restTimerDisplay?.classList.add("timer-flash");
      setTimeout(()=>restTimerDisplay?.classList.remove("timer-flash"),2200);

      // Small vibration on supported phones.
      if(navigator.vibrate) navigator.vibrate([180,80,180]);
    }else{
      renderRestTimer();
    }
  },1000);
}

function resetRestTimer(){
  setRestTimer(restTimer.duration,false);
}

function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const view=document.getElementById(`view-${name}`);
  if(view) view.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
  const nav=document.querySelector(`.nav-item[data-view="${name}"]`);
  if(nav) nav.classList.add("active");
}

function latestWorkoutForExercise(exerciseId){
  const items=workoutsFor(exerciseId);
  return items.length ? items[items.length-1] : null;
}

function startActiveWorkout(){
  const day=workoutDaySelect.value || "A";
  const routine=state.routines?.[day] || defaultRoutines[day];
  if(!routine) return;
  activeWorkout={
    day,
    name:routine.name,
    exerciseIds:[...routine.exercises],
    index:0,
    startedAt:nowISO(),
    completedIds:[],
    drafts:{}
  };
  showView("active");
  renderActiveExercise();
}


function defaultRestForExercise(ex){
  const heavy = ["bench","legpress","hipthrust","shoulderpress","pullup","row","pulldown"];
  const short = ["plank","deadbug","sideraise","facepull","dbcurl","hammercurl","ezcurl","tricepspush","tricepsext","hangingknees"];
  if(heavy.includes(ex.id)) return 120;
  if(short.includes(ex.id)) return 60;
  return 90;
}


function saveActiveDraft(){
  if(!activeWorkout) return;
  const id=activeWorkout.exerciseIds[activeWorkout.index];
  if(!id) return;
  const reps=[...document.querySelectorAll(".active-rep-input")].map(i=>i.value);
  activeWorkout.drafts[id]={
    weight:activeWeightInput?.value ?? "",
    reps,
    rir:activeRirInput?.value ?? "",
    note:activeNoteInput?.value ?? ""
  };
}

function restoreActiveDraft(ex){
  const draft=activeWorkout?.drafts?.[ex.id];
  if(!draft) return false;
  activeWeightInput.value=draft.weight ?? "";
  const inputs=[...document.querySelectorAll(".active-rep-input")];
  inputs.forEach((inp,i)=>inp.value=draft.reps?.[i] ?? "");
  activeRirInput.value=draft.rir ?? "";
  activeNoteInput.value=draft.note ?? "";
  return true;
}

function firstUnfinishedIndex(afterIndex=-1){
  if(!activeWorkout) return -1;
  const total=activeWorkout.exerciseIds.length;
  for(let step=1; step<=total; step++){
    const idx=(afterIndex+step+total)%total;
    const id=activeWorkout.exerciseIds[idx];
    if(!activeWorkout.completedIds.includes(id)) return idx;
  }
  return -1;
}

function renderActiveExerciseSwitcher(){
  if(!activeWorkout || !activeExerciseSelect) return;
  activeExerciseSelect.innerHTML=activeWorkout.exerciseIds.map((id,idx)=>{
    const ex=getExercise(id);
    const done=activeWorkout.completedIds.includes(id);
    const current=idx===activeWorkout.index;
    const prefix=done ? "✓ " : "";
    return `<option value="${idx}" ${current?"selected":""} ${done?"disabled":""}>${prefix}${ex?.name ?? id}</option>`;
  }).join("");
}

function renderActiveExercise(){
  if(!activeWorkout) return;
  const total=activeWorkout.exerciseIds.length;
  if(activeWorkout.index>=total){
    finishActiveWorkout();
    return;
  }
  const id=activeWorkout.exerciseIds[activeWorkout.index];
  const ex=getExercise(id);
  if(!ex){
    activeWorkout.index++;
    renderActiveExercise();
    return;
  }

  activeWorkoutName.textContent=activeWorkout.name.toUpperCase();
  activeExerciseName.textContent=ex.name;
  activeCounter.textContent=`${activeWorkout.completedIds.length}/${total} klaar`;
  activeProgressBar.style.width=`${(activeWorkout.completedIds.length/total)*100}%`;
  renderActiveExerciseSwitcher();

  const prev=latestWorkoutForExercise(ex.id);
  if(prev){
    previousWeight.textContent=fmtKg(prev.weight);
    previousReps.textContent=`${prev.reps.join(" / ")} reps`;
  }else{
    previousWeight.textContent="Nog geen historie";
    previousReps.textContent="";
  }

  activeTarget.textContent=`${ex.sets} × ${ex.min}–${ex.max}`;
  const sug=suggestedWeight(ex);
  activeSuggested.textContent=fmtKg(sug);
  activeIncrement.textContent=ex.increment ? `+${fmtKg(ex.increment)}` : "—";

  activeSetsContainer.innerHTML=Array.from({length:ex.sets},(_,i)=>`
    <div class="set-box">
      <label>Set ${i+1}</label>
      <input class="active-rep-input" type="number" inputmode="numeric" min="0" max="100" placeholder="${ex.min}-${ex.max}">
    </div>`).join("");

  activeWeightInput.value=(sug!==null && sug!==undefined) ? sug : "";
  activeRirInput.value="";
  activeNoteInput.value="";
  restoreActiveDraft(ex);
  activeResultBox.className="result hidden";
  activeResultBox.textContent="";
  setRestTimer(defaultRestForExercise(ex), false);
  const unfinishedCount=activeWorkout.exerciseIds.filter(id=>!activeWorkout.completedIds.includes(id)).length;
  document.getElementById("saveAndNextBtn").textContent =
    unfinishedCount===1 ? "Opslaan & workout afronden" : "Opslaan & volgende";
}

function saveActiveExercise(){
  if(!activeWorkout) return;
  const id=activeWorkout.exerciseIds[activeWorkout.index];
  const ex=getExercise(id);
  const weightRaw=activeWeightInput.value;
  const reps=[...document.querySelectorAll(".active-rep-input")].map(i=>Number(i.value));

  // Bodyweight/core may reasonably use 0 kg; only reps are mandatory.
  if(reps.some(r=>!r)){
    alert("Vul alle sets in.");
    return;
  }
  let weight = weightRaw==="" ? 0 : Number(weightRaw);
  const hitTop=reps.every(r=>r>=ex.max);
  const nextWeight=hitTop ? weight + Number(ex.increment || 0) : weight;

  state.workouts.push({
    id:uid(), date:nowISO(), workoutDay:activeWorkout.day,
    workoutSessionStartedAt:activeWorkout.startedAt,
    exerciseId:ex.id, weight, reps,
    rir:activeRirInput.value, note:activeNoteInput.value.trim(),
    status:hitTop ? "VERHOGEN" : "HOUDEN", nextWeight
  });
  saveState();
  if(!activeWorkout.completedIds.includes(ex.id)) activeWorkout.completedIds.push(ex.id);
  delete activeWorkout.drafts[ex.id];

  activeResultBox.className=`result ${hitTop?"increase":"hold"}`;
  activeResultBox.textContent=hitTop && ex.increment
    ? `✓ Doel gehaald. Volgende keer: ${fmtKg(nextWeight)}`
    : hitTop
      ? "✓ Doel gehaald."
      : `Volgende keer hetzelfde: ${fmtKg(nextWeight)}`;

  setTimeout(()=>{
    const nextIndex=firstUnfinishedIndex(activeWorkout.index);
    renderAll();
    if(nextIndex===-1){
      finishActiveWorkout();
      return;
    }
    activeWorkout.index=nextIndex;
    renderActiveExercise();
  },350);
}

function skipActiveExercise(){
  if(!activeWorkout) return;
  saveActiveDraft();
  stopRestTimerInterval();
  const nextIndex=firstUnfinishedIndex(activeWorkout.index);
  if(nextIndex===-1){
    finishActiveWorkout();
    return;
  }
  activeWorkout.index=nextIndex;
  renderActiveExercise();
}

function finishActiveWorkout(){
  stopRestTimerInterval();
  const name=activeWorkout?.name || "Workout";
  activeWorkout=null;
  renderAll();
  showView("workout");
  alert(`${name} afgerond!`);
}

function cancelActiveWorkout(){
  if(!activeWorkout){ showView("workout"); return; }
  if(confirm("Workout stoppen? Opgeslagen oefeningen blijven bewaard.")){
    stopRestTimerInterval();
    activeWorkout=null;
    showView("workout");
  }
}


function ensureRoutineState(){
  if(!state.routines) state.routines=JSON.parse(JSON.stringify(defaultRoutines));
  for(const key of ["A","B","C"]){
    if(!state.routines[key]) state.routines[key]=JSON.parse(JSON.stringify(defaultRoutines[key]));
    if(!Array.isArray(state.routines[key].exercises)) state.routines[key].exercises=[];
  }
}

function assignedWorkoutDays(exerciseId){
  ensureRoutineState();
  return ["A","B","C"].filter(day=>state.routines[day].exercises.includes(exerciseId));
}

function setExerciseAssignments(exerciseId, days){
  ensureRoutineState();
  for(const day of ["A","B","C"]){
    const list=state.routines[day].exercises;
    const has=list.includes(exerciseId);
    const wants=days.includes(day);
    if(wants && !has) list.push(exerciseId);
    if(!wants && has) state.routines[day].exercises=list.filter(id=>id!==exerciseId);
  }
}

function renderExerciseSelect(){
  const day = workoutDaySelect?.value || "A";
  const routine = state.routines?.[day] || defaultRoutines[day];
  const ids = routine?.exercises || state.exercises.map(e=>e.id);
  const items = ids.map(id=>getExercise(id)).filter(Boolean);
  exerciseSelect.innerHTML = items.map(e=>`<option value="${e.id}">${e.name}</option>`).join("");
  updateWorkoutForm();
}
function updateWorkoutForm(){
  const ex = getExercise(exerciseSelect.value) || state.exercises[0];
  if(!ex) return;
  targetLabel.textContent = `${ex.sets} × ${ex.min}–${ex.max}`;
  const sug = suggestedWeight(ex);
  suggestedWeightEl.textContent = fmtKg(sug);
  incrementLabel.textContent = `+${fmtKg(ex.increment)}`;
  if(sug!==null) weightInput.value = sug;
  else weightInput.value = "";
  setsContainer.innerHTML = Array.from({length:ex.sets},(_,i)=>`
    <div class="set-box">
      <label>Set ${i+1}</label>
      <input class="rep-input" type="number" inputmode="numeric" min="0" max="50" placeholder="${ex.min}-${ex.max}">
    </div>`).join("");
  resultBox.className = "result hidden";
  resultBox.textContent = "";
}

workoutDaySelect?.addEventListener("change", renderExerciseSelect);
exerciseSelect.addEventListener("change", updateWorkoutForm);

startWorkoutBtn?.addEventListener("click", startActiveWorkout);
document.getElementById("saveAndNextBtn")?.addEventListener("click", saveActiveExercise);
document.getElementById("skipExerciseBtn")?.addEventListener("click", skipActiveExercise);

activeExerciseSelect?.addEventListener("change",()=>{
  if(!activeWorkout) return;
  saveActiveDraft();
  stopRestTimerInterval();
  activeWorkout.index=Number(activeExerciseSelect.value);
  renderActiveExercise();
});

document.getElementById("cancelActiveWorkoutBtn")?.addEventListener("click", cancelActiveWorkout);

restTimerStartBtn?.addEventListener("click", startRestTimer);
restTimerResetBtn?.addEventListener("click", resetRestTimer);

activeSetsContainer?.addEventListener("keydown",(e)=>{
  if(e.key!=="Enter" || !e.target.classList.contains("active-rep-input")) return;
  e.preventDefault();
  const inputs=[...document.querySelectorAll(".active-rep-input")];
  const idx=inputs.indexOf(e.target);
  if(e.target.value){
    setRestTimer(restTimer.duration,true);
    if(idx>=0 && idx<inputs.length-1) inputs[idx+1].focus();
  }
});

document.querySelectorAll(".timer-preset").forEach(btn=>{
  btn.addEventListener("click",()=>setRestTimer(Number(btn.dataset.seconds),false));
});



document.getElementById("saveWorkoutBtn").addEventListener("click", ()=>{
  const ex = getExercise(exerciseSelect.value);
  const weight = Number(weightInput.value);
  const reps = [...document.querySelectorAll(".rep-input")].map(i=>Number(i.value));
  if(!ex || !weight || reps.some(r=>!r)){
    alert("Vul gewicht en alle sets in.");
    return;
  }
  const hitTop = reps.every(r=>r>=ex.max);
  const nextWeight = hitTop ? weight + Number(ex.increment) : weight;
  state.workouts.push({
    id:uid(), date:nowISO(), workoutDay:workoutDaySelect?.value || "", exerciseId:ex.id, weight, reps,
    rir:rirInput.value, note:noteInput.value.trim(),
    status: hitTop ? "VERHOGEN" : "HOUDEN", nextWeight
  });
  saveState();
  resultBox.className = `result ${hitTop?"increase":"hold"}`;
  resultBox.textContent = hitTop
    ? `✓ Doel gehaald. Volgende keer: ${fmtKg(nextWeight)}`
    : `Nog niet verhogen. Volgende keer: ${fmtKg(nextWeight)}`;
  rirInput.value="";
  noteInput.value="";
  renderAll();
});

function renderHistory(){
  const el = document.getElementById("historyList");
  const items = [...state.workouts].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!items.length){ el.innerHTML = `<div class="card muted">Nog geen trainingen opgeslagen.</div>`; return; }
  el.innerHTML = items.map(w=>{
    const ex=getExercise(w.exerciseId);
    return `<div class="history-item">
      <div class="row">
        <div>
          <div class="history-title">${ex?.name ?? "Onbekend"}</div>
          <div class="sub">${localDate(w.date)}${w.workoutDay?` · Workout ${w.workoutDay}`:""} · ${fmtKg(w.weight)} · ${w.reps.join(" / ")} reps${w.rir?` · RIR ${w.rir}`:""}</div>
        </div>
        <span class="pill ${w.status==="VERHOGEN"?"up":"hold"}">${w.status}</span>
      </div>
      ${w.note?`<div class="sub" style="margin-top:8px">${w.note}</div>`:""}
    </div>`;
  }).join("");
}

function renderProgress(){
  document.getElementById("totalSessions").textContent = state.workouts.length;
  document.getElementById("totalIncreases").textContent = state.workouts.filter(w=>w.status==="VERHOGEN").length;
  document.getElementById("totalExercises").textContent = state.exercises.length;
  const el = document.getElementById("progressList");
  el.innerHTML = state.exercises.map(ex=>{
    const ws = workoutsFor(ex.id);
    const current = suggestedWeight(ex);
    const pr = ws.length ? Math.max(...ws.map(w=>w.weight)) : null;
    const latest = ws.length ? ws[ws.length-1] : null;
    return `<div class="progress-item">
      <div class="row">
        <div>
          <div class="exercise-title">${ex.name}</div>
          <div class="sub">${ex.muscle || ""}</div>
        </div>
        <div style="text-align:right">
          <div><strong>${fmtKg(current)}</strong></div>
          <div class="sub">advies</div>
        </div>
      </div>
      <div class="sub" style="margin-top:9px">PR: ${fmtKg(pr)} · Sessies: ${ws.length}${latest?` · Laatst: ${latest.reps.join("/")}`:""}</div>
    </div>`;
  }).join("");
}

function renderExercises(){
  const el=document.getElementById("exerciseList");
  el.innerHTML = state.exercises.map(ex=>`
    <div class="exercise-item">
      <div class="row">
        <div>
          <div class="exercise-title">${ex.name}</div>
          <div class="sub">${ex.muscle || "—"} · ${ex.sets} × ${ex.min}-${ex.max} · stap ${fmtKg(ex.increment)} · ${assignedWorkoutDays(ex.id).length ? "Workout "+assignedWorkoutDays(ex.id).join(", ") : "geen workout"}</div>
        </div>
        <button class="text-btn edit-ex" data-id="${ex.id}">Wijzig</button>
      </div>
    </div>`).join("");
  document.querySelectorAll(".edit-ex").forEach(btn=>btn.addEventListener("click",()=>openExerciseDialog(btn.dataset.id)));
}

const dialog=document.getElementById("exerciseDialog");

function openWorkoutManager(){
  ensureRoutineState();
  const day=workoutDaySelect.value || "A";
  const routine=state.routines[day];
  workoutManagerTitle.textContent=`${routine.name} beheren`;

  // Selected exercises first in their current order, then unselected exercises alphabetically.
  const selected=routine.exercises.map(id=>getExercise(id)).filter(Boolean);
  const unselected=state.exercises
    .filter(ex=>!routine.exercises.includes(ex.id))
    .sort((a,b)=>a.name.localeCompare(b.name,"nl"));

  const rows=[...selected,...unselected];
  workoutExerciseChecklist.innerHTML=rows.map(ex=>{
    const checked=routine.exercises.includes(ex.id);
    const currentIndex=routine.exercises.indexOf(ex.id);
    return `<div class="workout-check-item" data-id="${ex.id}">
      <input class="routine-check" type="checkbox" value="${ex.id}" ${checked?"checked":""}>
      <div>
        <strong>${ex.name}</strong>
        <div class="sub">${ex.muscle || "—"} · ${ex.sets} × ${ex.min}-${ex.max}</div>
      </div>
      <button type="button" class="order-btn routine-up" ${!checked || currentIndex<=0 ? "disabled":""}>↑</button>
      <button type="button" class="order-btn routine-down" ${!checked || currentIndex<0 || currentIndex>=routine.exercises.length-1 ? "disabled":""}>↓</button>
    </div>`;
  }).join("");

  workoutManagerDialog.showModal();
}

function saveWorkoutManager(){
  ensureRoutineState();
  const day=workoutDaySelect.value || "A";
  const checked=[...workoutExerciseChecklist.querySelectorAll(".routine-check:checked")].map(x=>x.value);

  // Preserve current routine order, then append newly checked items in visible order.
  const old=state.routines[day].exercises;
  const visible=[...workoutExerciseChecklist.querySelectorAll(".workout-check-item")].map(row=>row.dataset.id);
  const ordered=[
    ...old.filter(id=>checked.includes(id)),
    ...visible.filter(id=>checked.includes(id) && !old.includes(id))
  ];
  state.routines[day].exercises=[...new Set(ordered)];
  saveState();
  workoutManagerDialog.close();
  renderAll();
}

function moveRoutineExercise(exerciseId, direction){
  ensureRoutineState();
  const day=workoutDaySelect.value || "A";
  const list=state.routines[day].exercises;
  const idx=list.indexOf(exerciseId);
  if(idx<0) return;
  const target=idx+direction;
  if(target<0 || target>=list.length) return;
  [list[idx],list[target]]=[list[target],list[idx]];
  saveState();
  openWorkoutManager();
}

function openExerciseDialog(id=null){
  const ex=id?getExercise(id):{id:"",name:"",muscle:"",sets:3,min:8,max:12,increment:2.5,start:""};
  document.getElementById("exerciseDialogTitle").textContent=id?"Oefening wijzigen":"Oefening toevoegen";
  document.getElementById("editExerciseId").value=ex.id||"";
  document.getElementById("editName").value=ex.name||"";
  document.getElementById("editMuscle").value=ex.muscle||"";
  document.getElementById("editSets").value=ex.sets;
  document.getElementById("editMin").value=ex.min;
  document.getElementById("editMax").value=ex.max;
  document.getElementById("editIncrement").value=ex.increment;
  document.getElementById("editStart").value=ex.start ?? "";
  const assigned=id ? assignedWorkoutDays(id) : [];
  document.querySelectorAll('input[name="workoutAssign"]').forEach(cb=>{
    cb.checked=assigned.includes(cb.value);
  });
  dialog.showModal();
}
document.getElementById("addExerciseBtn").addEventListener("click",()=>openExerciseDialog());

manageWorkoutBtn?.addEventListener("click", openWorkoutManager);
document.getElementById("workoutManagerForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  saveWorkoutManager();
});
workoutExerciseChecklist?.addEventListener("click",(e)=>{
  const row=e.target.closest(".workout-check-item");
  if(!row) return;
  if(e.target.classList.contains("routine-up")){
    moveRoutineExercise(row.dataset.id,-1);
  }else if(e.target.classList.contains("routine-down")){
    moveRoutineExercise(row.dataset.id,1);
  }
});
workoutExerciseChecklist?.addEventListener("change",(e)=>{
  if(!e.target.classList.contains("routine-check")) return;
  // Re-render controls immediately by temporarily updating current routine.
  ensureRoutineState();
  const day=workoutDaySelect.value || "A";
  const id=e.target.value;
  if(e.target.checked && !state.routines[day].exercises.includes(id)){
    state.routines[day].exercises.push(id);
  }else if(!e.target.checked){
    state.routines[day].exercises=state.routines[day].exercises.filter(x=>x!==id);
  }
  saveState();
  openWorkoutManager();
});


document.getElementById("exerciseForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const id=document.getElementById("editExerciseId").value;
  const obj={
    id:id||uid(),
    name:document.getElementById("editName").value.trim(),
    muscle:document.getElementById("editMuscle").value.trim(),
    sets:Number(document.getElementById("editSets").value),
    min:Number(document.getElementById("editMin").value),
    max:Number(document.getElementById("editMax").value),
    increment:Number(document.getElementById("editIncrement").value),
    start:document.getElementById("editStart").value===""?null:Number(document.getElementById("editStart").value)
  };
  if(id){
    const idx=state.exercises.findIndex(x=>x.id===id);
    state.exercises[idx]=obj;
  }else state.exercises.push(obj);
  const assignedDays=[...document.querySelectorAll('input[name="workoutAssign"]:checked')].map(cb=>cb.value);
  setExerciseAssignments(obj.id, assignedDays);
  saveState();
  dialog.close();
  renderAll();
});

document.getElementById("saveBodyBtn").addEventListener("click",()=>{
  const weight=Number(document.getElementById("bodyWeightInput").value);
  const waistRaw=document.getElementById("waistInput").value;
  if(!weight){ alert("Vul je gewicht in."); return; }
  state.body.push({id:uid(),date:nowISO(),weight,waist:waistRaw===""?null:Number(waistRaw)});
  saveState();
  document.getElementById("bodyWeightInput").value="";
  document.getElementById("waistInput").value="";
  renderBody();
});
function renderBody(){
  const el=document.getElementById("bodyList");
  const items=[...state.body].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!items.length){el.innerHTML=`<div class="card muted">Nog geen metingen opgeslagen.</div>`;return;}
  el.innerHTML=items.map(x=>`<div class="body-item row">
    <div><strong>${x.weight.toFixed(1)} kg</strong><div class="sub">${localDate(x.date)}</div></div>
    <div style="text-align:right"><strong>${x.waist?`${x.waist.toFixed(1)} cm`:"—"}</strong><div class="sub">middel</div></div>
  </div>`).join("");
}

document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{
  if(activeWorkout && btn.dataset.view!=="workout"){
    if(!confirm("Je workout is nog bezig. Naar een ander scherm gaan?")) return;
  }
  showView(btn.dataset.view);
}));

document.getElementById("clearHistoryBtn").addEventListener("click",()=>{
  if(confirm("Alle trainingshistorie wissen?")){ state.workouts=[]; saveState(); renderAll(); }
});
document.getElementById("resetBtn").addEventListener("click",()=>{
  if(confirm("Hele app resetten?")){ localStorage.removeItem(STORAGE_KEY); state={exercises:defaultExercises,routines:defaultRoutines,workouts:[],body:[]}; saveState(); renderAll(); }
});

document.getElementById("exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`gym-progress-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById("importBtn").addEventListener("click",()=>document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{
    const imported=JSON.parse(await file.text());
    if(!imported.exercises || !imported.workouts) throw new Error();
    state=imported; saveState(); renderAll(); alert("Backup geïmporteerd.");
  }catch(err){ alert("Dit lijkt geen geldige backup."); }
});

function renderAll(){
  const current=exerciseSelect.value;
  renderExerciseSelect();
  if(current && state.exercises.some(e=>e.id===current)){ exerciseSelect.value=current; updateWorkoutForm(); }
  renderHistory(); renderProgress(); renderExercises(); renderBody();
}
renderAll();
renderRestTimer();

if("serviceWorker" in navigator){ navigator.serviceWorker.register("./service-worker.js").catch(()=>{}); }
