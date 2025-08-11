import { 
  auth, provider, onAuthStateChanged, signInWithPopup, signOut, 
  db, ref, set, get, update, onValue 
} from './firebase-init.js';

// You can predefine admin emails like this, or store in the database later:
const ADMIN_EMAILS = [
  "your.admin@email.com"    // <--- Change to your admin email!
];

// --- DOM Elements ---
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const currentUserInfo = document.getElementById("currentUserInfo");
const userPhoto = document.getElementById("userPhoto");
const adminLoginPanel = document.getElementById("adminLoginPanel");
const workerMgmt = document.getElementById("workerMgmt");
const skillsSection = document.getElementById("skillsSection");

// Track user/admin
let currentUser = null;
let isAdmin = false;

// --- AUTH STATE CHANGES ---
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    currentUserInfo.textContent = user.displayName || user.email;
    userPhoto.src = user.photoURL;
    userPhoto.classList.remove("hide");
    loginBtn.style.display = "none";
    logoutBtn.style.display = "";
    checkAdmin(user.email);
  } else {
    // Logged out
    currentUser = null;
    currentUserInfo.textContent = "";
    userPhoto.classList.add("hide");
    loginBtn.style.display = "";
    logoutBtn.style.display = "none";
    showUI(false, false);
  }
});

// --- LOGIN/LOGOUT BUTTONS ---
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert("Login failed: " + e.message);
  }
});
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// --- ADMIN CHECK ---
function checkAdmin(email) {
  // (We can fetch from Firebase later if needed)
  isAdmin = ADMIN_EMAILS.map(e=>e.toLowerCase()).includes(email.toLowerCase());
  showUI(true, isAdmin);
}

// --- SHOW/HIDE UI BASED ON AUTH & ADMIN ---
function showUI(loggedIn, admin) {
  if (loggedIn && admin) {
    adminLoginPanel.classList.add("hide");
    workerMgmt.classList.remove("hide");
    skillsSection.classList.remove("hide");
  } else if (loggedIn && !admin) {
    adminLoginPanel.classList.add("hide");
    workerMgmt.classList.add("hide");
    skillsSection.classList.remove("hide");
  } else {
    adminLoginPanel.classList.add("hide");
    workerMgmt.classList.add("hide");
    skillsSection.classList.add("hide");
  }
}

// --- ELEMENTS ---
const addWorkerForm = document.getElementById("addWorkerForm");
const workerNameInput = document.getElementById("workerNameInput");
const workersList = document.getElementById("workersList");
const skillsTableContainer = document.getElementById("skillsTableContainer");

const SKILLS = [
  "Welding", "Machining", "Assembly", "Quality Control", "Repair"
]; // Add or edit skills as needed

// --- WORKER CRUD (Admins only) ---
// Add worker
if (addWorkerForm) {
  addWorkerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Only admins can add workers.");
    const name = workerNameInput.value.trim();
    if (!name) return;
    const workerId = name.toLowerCase().replace(/\s+/g,'-') + '-' + Date.now();
    await set(ref(db, 'workers/' + workerId), {
      name,
      createdBy: currentUser.email,
      createdAt: Date.now(),
    });
    // Initialize skills for new worker
    for (let skill of SKILLS) {
      set(ref(db, `skills/${workerId}/${skill}`), 0);
    }
    workerNameInput.value = '';
  });
}

// Delete worker
async function deleteWorker(workerId) {
  if (!isAdmin) return;
  if (confirm("Remove this worker and their skills?")) {
    await set(ref(db, 'workers/' + workerId), null);
    await set(ref(db, 'skills/' + workerId), null);
  }
}

// --- DISPLAY WORKERS LIST + LISTEN FOR LIVE CHANGES ---
onValue(ref(db, 'workers'), (snap) => {
  const workers = snap.val() || {};
  workersList.innerHTML = '';
  Object.entries(workers).forEach(([id, w]) => {
    let li = document.createElement('li');
    li.innerHTML = `
      <span><i class="fa fa-user"></i> ${w.name}</span>
      ${isAdmin ? `<button class="fancy-btn" title="Remove" onclick="window.__delWorker('${id}')"><i class="fa fa-trash"></i></button>` : ''}
    `;
    workersList.appendChild(li);
  });
  window.__delWorker = deleteWorker; // for button onclick
  renderSkillsTable(workers);
}, {onlyOnce: false}); // live subscription

// --- DISPLAY SKILLS TABLE (LIVE) ---
function renderSkillsTable(workers) {
  // First, get latest skills mapping for all workers
  get(ref(db, 'skills')).then(snap => {
    const allSkills = snap.val() || {};
    // Header row
    let html = `<table border="0" style="width:100%;border-collapse:collapse;"><thead><tr>
      <th>Worker</th>${SKILLS.map(s=>`<th>${s}</th>`).join('')}
    </tr></thead><tbody>`;
    for (const [wid, w] of Object.entries(workers||{})) {
      html += `<tr><td>${w.name}</td>`;
      for (const skill of SKILLS) {
        const level = allSkills[wid]?.[skill] ?? 0;
        html += `<td>${editableSkillCell(wid, skill, level)}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    skillsTableContainer.innerHTML = html;
    activateSkillCellEditing();
  });
}

// --- EDITABLE CELLS (Admins and regulars can both edit their own skills) ---
function editableSkillCell(wid, skill, lvl) {
  // Show 0-3 as a reactively color-coded editable cell if admin OR user's own row
  let classes = "level-cell ";
  if (lvl >= 2) classes += "level-high";
  else if (lvl == 1) classes += "level-medium";
  else classes += "level-low";
  const readonly = !isAdmin && (!currentUser||currentUser.email!==workersList.querySelector(`li span:contains(${skill})`)?.parentNode.getAttribute('data-id')); // let admin or self edit
  return `<input type="number" min="0" max="3" value="${lvl}" data-worker="${wid}" data-skill="${skill}" class="${classes}" style="width:42px" ${readonly ? "readonly" : ""}/>`;
}

// --- Activate editing of skill cells ---
function activateSkillCellEditing() {
  skillsTableContainer.querySelectorAll('input[type=number]').forEach(input => {
    input.addEventListener("change", async (e) => {
      let wid = input.dataset.worker, skill = input.dataset.skill;
      let val = Math.max(0, Math.min(3, Number(input.value)||0));
      if (!isAdmin) return; // (optional: allow user to edit their own row)
      await set(ref(db, `skills/${wid}/${skill}`), val);
      input.classList.add("animate__flash");
      setTimeout(() => input.classList.remove("animate__flash"), 700);
    });
  });
}
