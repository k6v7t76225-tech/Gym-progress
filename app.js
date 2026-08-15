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
    name:"Workout B",
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

const startWorkoutBtn = document.getElementById("startWorkoutBtn");
const activeWorkoutName = document.getElementById("activeWorkoutName");
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


document.getElementById("todayDate").textContent = new Date().toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"});


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
    startedAt:nowISO()
  };
  showView("active");
  renderActiveExercise();
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
  activeCounter.textContent=`${activeWorkout.index+1}/${total}`;
  activeProgressBar.style.width=`${((activeWorkout.index)/total)*100}%`;

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
  activeWeightInput.value=(sug!==null && sug!==undefined) ? sug : "";

  activeSetsContainer.innerHTML=Array.from({length:ex.sets},(_,i)=>`
    <div class="set-box">
      <label>Set ${i+1}</label>
      <input class="active-rep-input" type="number" inputmode="numeric" min="0" max="100" placeholder="${ex.min}-${ex.max}">
    </div>`).join("");

  activeRirInput.value="";
  activeNoteInput.value="";
  activeResultBox.className="result hidden";
  activeResultBox.textContent="";
  document.getElementById("saveAndNextBtn").textContent =
    activeWorkout.index===total-1 ? "Opslaan & workout afronden" : "Opslaan & volgende";
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

  activeResultBox.className=`result ${hitTop?"increase":"hold"}`;
  activeResultBox.textContent=hitTop && ex.increment
    ? `✓ Doel gehaald. Volgende keer: ${fmtKg(nextWeight)}`
    : hitTop
      ? "✓ Doel gehaald."
      : `Volgende keer hetzelfde: ${fmtKg(nextWeight)}`;

  setTimeout(()=>{
    activeWorkout.index++;
    renderAll();
    renderActiveExercise();
  },350);
}

function skipActiveExercise(){
  if(!activeWorkout) return;
  activeWorkout.index++;
  renderActiveExercise();
}

function finishActiveWorkout(){
  const name=activeWorkout?.name || "Workout";
  activeWorkout=null;
  renderAll();
  showView("workout");
  alert(`${name} afgerond!`);
}

function cancelActiveWorkout(){
  if(!activeWorkout){ showView("workout"); return; }
  if(confirm("Workout stoppen? Opgeslagen oefeningen blijven bewaard.")){
    activeWorkout=null;
    showView("workout");
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
document.getElementById("cancelActiveWorkoutBtn")?.addEventListener("click", cancelActiveWorkout);


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
          <div class="sub">${ex.muscle || "—"} · ${ex.sets} × ${ex.min}-${ex.max} · stap ${fmtKg(ex.increment)} · start ${fmtKg(ex.start)}</div>
        </div>
        <button class="text-btn edit-ex" data-id="${ex.id}">Wijzig</button>
      </div>
    </div>`).join("");
  document.querySelectorAll(".edit-ex").forEach(btn=>btn.addEventListener("click",()=>openExerciseDialog(btn.dataset.id)));
}

const dialog=document.getElementById("exerciseDialog");
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
  dialog.showModal();
}
document.getElementById("addExerciseBtn").addEventListener("click",()=>openExerciseDialog());

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

if("serviceWorker" in navigator){ navigator.serviceWorker.register("./service-worker.js").catch(()=>{}); }
