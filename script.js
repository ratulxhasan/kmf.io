// --- Workers Data Structure ---
const MAX_WORKERS = 15;
const AREAS = [
  {
    name: 'DPI',
    skills: [
      'Universal Granulation Machine',
      'Capsule Filling Machine',
      'Capsule Blister Machine',
      'BPR',
      'BMR',
    ],
    tableBodyId: 'dpi-skills-body'
  },
  {
    name: 'MDI',
    skills: [
      '30L Vessel',
      '100L Vessel',
      'Canister Cleaning Machine',
      'Canister Crimping Machine',
      'Canister Filling Machine',
      'BMR',
      'Dispensing'
    ],
    tableBodyId: 'mdi-skills-body'
  },
  {
    name: 'Packaging',
    skills: [
      'Conveyor Belt',
      'Sachet Sealing Machine',
      'Balance',
      'BPR'
    ],
    tableBodyId: 'packaging-skills-body'
  },
];

// Load & Save to localStorage
const STORAGE_KEY = 'workersSkillsData_v1';

// Utility: Save
function saveWorkersDataToLocal(workers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
}

// Utility: Load
function loadWorkersDataFromLocal() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try { return JSON.parse(data); }
  catch { return []; }
}

// --- UI references ---
const workerNameInput = document.getElementById('workerName');
const addWorkerBtn = document.getElementById('addWorkerBtn');
const workerSelect = document.getElementById('workerSelect');
const saveWorkerBtn = document.getElementById('saveWorkerBtn');
const deleteWorkerBtn = document.getElementById('deleteWorkerBtn');

// All workers data
let workers = loadWorkersDataFromLocal();

// --- Worker Template ---
function defaultWorker(name) {
  const workerObj = { name, skills: {} };
  AREAS.forEach(area => {
    workerObj.skills[area.name] = {};
    area.skills.forEach(skill => {
      workerObj.skills[area.name][skill] = 0;
    });
  });
  return workerObj;
}

// --- RENDER ALL TABLES ---
function renderSkillTables() {
  AREAS.forEach(area => {
    const tbody = document.getElementById(area.tableBodyId);
    tbody.innerHTML = '';
    workers.forEach((worker, wIdx) => {
      const tr = document.createElement('tr');
      // Worker Name
      const tdName = document.createElement('td');
      tdName.textContent = worker.name || `Worker ${wIdx+1}`;
      tr.appendChild(tdName);

      // Skills
      area.skills.forEach(skill => {
        const tdSkill = document.createElement('td');
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = 0;
        inp.max = 10;
        inp.value = worker.skills[area.name][skill];
        inp.className = 'skill-input';
        inp.dataset.workerIdx = wIdx;
        inp.dataset.area = area.name;
        inp.dataset.skill = skill;

        colorSkillCell(inp, inp.value);

        // Input: When change, update in workers array
        inp.addEventListener('input', function () {
          let val = parseInt(this.value, 10);
          if (isNaN(val)) val = 0;
          if (val < 0) val = 0;
          if (val > 10) val = 10;
          workers[wIdx].skills[area.name][skill] = val;
          colorSkillCell(this, val);
          saveWorkersDataToLocal(workers);
        });

        tdSkill.appendChild(inp);
        tr.appendChild(tdSkill);
      });

      tbody.appendChild(tr);
    });
  });
}

// --- Helper for coloring skill cells ---
function colorSkillCell(input, val) {
  input.classList.remove('low', 'medium', 'high');
  val = parseInt(val, 10);
  if (val >= 0 && val <= 4) input.classList.add('low');
  if (val >= 5 && val <= 8) input.classList.add('medium');
  if (val >= 9 && val <= 10) input.classList.add('high');
}

// --- RENDER WORKER SELECT Dropdown ---
function renderWorkerDropdown() {
  workerSelect.innerHTML = `<option value="">-- Select Worker to Edit --</option>`;
  workers.forEach((worker, i) => {
    workerSelect.innerHTML += `<option value="${i}">${worker.name || `Worker ${i+1}`}</option>`;
  });
}

// --- Add Worker ---
addWorkerBtn.onclick = () => {
  const name = workerNameInput.value.trim();
  if (workers.length >= MAX_WORKERS) {
    alert('Max 15 workers allowed!');
    return;
  }
  if (!name) {
    alert('Please enter worker name!');
    return;
  }
  workers.push(defaultWorker(name));
  saveWorkersDataToLocal(workers);
  workerNameInput.value = '';
  renderSkillTables();
  renderWorkerDropdown();
};

// --- Save Edited Worker Name ---
saveWorkerBtn.onclick = () => {
  const wIdx = parseInt(workerSelect.value, 10);
  if (isNaN(wIdx) || wIdx < 0 || wIdx >= workers.length) {
    alert('Choose a worker to edit');
    return;
  }
  const newName = workerNameInput.value.trim();
  if (!newName) {
    alert('Worker name cannot be empty!');
    return;
  }
  workers[wIdx].name = newName;
  saveWorkersDataToLocal(workers);
  renderSkillTables();
  renderWorkerDropdown();
};

// --- Select Worker to Edit (fills name input for easy editing) ---
workerSelect.onchange = function () {
  const wIdx = parseInt(this.value, 10);
  if (isNaN(wIdx) || wIdx < 0 || wIdx >= workers.length) {
    workerNameInput.value = '';
    return;
  }
  workerNameInput.value = workers[wIdx].name;
};

// --- Delete Worker ---
deleteWorkerBtn.onclick = () => {
  const wIdx = parseInt(workerSelect.value, 10);
  if (isNaN(wIdx) || wIdx < 0 || wIdx >= workers.length) {
    alert('Select a worker to delete');
    return;
  }
  if (!confirm(`Delete worker "${workers[wIdx].name}"?`)) return;
  workers.splice(wIdx, 1);
  workerNameInput.value = '';
  saveWorkersDataToLocal(workers);
  renderSkillTables();
  renderWorkerDropdown();
};

// --- INIT on page load ---
renderSkillTables();
renderWorkerDropdown();

// ------- LOGIN/LOGOUT Logic (copy this into your JS file) -------

// [Update these lines with your actual protected controls/buttons/inputs]
const protectedControls = [
  workerNameInput, addWorkerBtn, workerSelect, saveWorkerBtn, deleteWorkerBtn
];

// Params
const ACCEPTED_USERS = [
  { user: "CF9512", pass: "test2025" }
];
const REMEMBER_ME_KEY = "demoUserRememberMe";
const AUTO_LOGOUT_INTERVAL = 3 * 60 * 1000; // 3 minutes

// Elements
const loginBtn     = document.getElementById('loginBtn');     // your login button
const loginStatus  = document.getElementById('loginStatus');  // your login status div
const modalBg      = document.getElementById('editor-login-modal');
const modalForm    = document.getElementById('editor-login-form');
const modalUser    = document.getElementById('editor-login-user');
const modalPass    = document.getElementById('editor-login-pass');
const togglePassIcon = document.getElementById('togglePass');
const rememberMeCheckbox = document.getElementById('rememberMe');
const forgotPassLink    = document.getElementById('forgotPass');
const modalError   = document.getElementById('editor-login-error');
const modalClose   = document.getElementById('editor-login-close');

// State
let isEditorMode = false;
let autoLogoutTimer = null;

// --- Show/Hide modal ---
function showLoginModal() {
  modalBg.style.display="flex";
  let rememberedUser = localStorage.getItem(REMEMBER_ME_KEY) || "";
  modalUser.value = rememberedUser;
  rememberMeCheckbox.checked = !!rememberedUser;
  modalPass.value = "";
  modalError.textContent = "";
  setTimeout(() => (rememberedUser ? modalPass : modalUser).focus(), 100);
}
function hideLoginModal() { modalBg.style.display = "none"; }

function applyEditorMode(enabled, username="") {
  protectedControls.forEach(el => {
    if(el) el.disabled = !enabled;
    if(el && (el.tagName==="INPUT"||el.tagName==="SELECT")) {
      el.style.opacity = enabled ? "1" : "0.65";
    }
  });
  loginBtn.style.display = enabled ? "none":"inline-block";
  loginStatus.innerHTML = enabled ? (
    `Welcome, <b>${username}</b>! <a href="#" id="logoutLink" style="color:#d13257;text-decoration:underline;margin-left:17px;">Logout</a>`
  ) : "";
  if(enabled) {
    setTimeout(() => {
      const logoutLink = document.getElementById("logoutLink");
      if (logoutLink) logoutLink.onclick=function(e){e.preventDefault();logout();};
    }, 120);
  }
}

function logout(forced=false) {
  isEditorMode = false;
  stopAutoLogout();
  applyEditorMode(false, "");
  if(!rememberMeCheckbox.checked) localStorage.removeItem(REMEMBER_ME_KEY);
  if(forced) alert("Logged out due to inactivity (3 minutes).");
}

// Button Events
if(loginBtn) loginBtn.onclick = ()=>showLoginModal();
protectedControls.forEach(function(el) {
  if(el) ["click", "focus"].forEach(function(evtType){
    el.addEventListener(evtType, function(event){
      if(!isEditorMode){
        event.preventDefault();
        event.stopPropagation();
        showLoginModal();
        return false;
      }
    }, true);
  });
});
modalForm.onsubmit = function(e) {
  e.preventDefault();
  const username = modalUser.value.trim();
  const password = modalPass.value.trim();
  const found = ACCEPTED_USERS.find(u => u.user === username && u.pass === password);
  if (found) {
    isEditorMode = true;
    hideLoginModal();
    applyEditorMode(true, username);
    resetAutoLogout();
    if(rememberMeCheckbox.checked) {
      localStorage.setItem(REMEMBER_ME_KEY, username);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  } else {
    modalError.textContent = "Error!User not found⛔ Access Denied!";
    modalPass.value = "";
    setTimeout(()=>modalUser.focus(),50);
  }
};
modalClose.onclick = hideLoginModal;
window.addEventListener("keydown", function(e){
  if(e.key==="Escape"){ hideLoginModal(); }
});
// Hide/Show password
togglePassIcon.onclick = function() {
  const isPass = modalPass.getAttribute('type')==='password';
  modalPass.setAttribute('type', isPass ? 'text' : 'password');
  togglePassIcon.textContent = isPass ? "hide" :"show";
};
// Forgot password
forgotPassLink.onclick = function(e){
  e.preventDefault();
  let un = modalUser.value.trim();
  let mailto = 
      "mailto:ratulhasan2a@gmail.com?subject=Password%20Reset%20Request"
      +"&body="
      +encodeURIComponent(
          "Hello,\n\nI forgot my password for the username: "
          +(un || "[username]")
          +"\n\nPlease assist. Thanks!"
      );
  window.location.href = mailto;
};
// --- AUTO LOGOUT
function resetAutoLogout(){
  stopAutoLogout();
  if(isEditorMode){
    autoLogoutTimer = setTimeout(()=>logout(true), AUTO_LOGOUT_INTERVAL);
  }
}
function stopAutoLogout(){
  if(autoLogoutTimer) clearTimeout(autoLogoutTimer);
}
["mousemove","keydown","mousedown","touchstart"].forEach(evt=>{
  document.addEventListener(evt, function(){
    if(isEditorMode) resetAutoLogout();
  }, {passive:true});
});
// --- Init: lock editing
applyEditorMode(false);
