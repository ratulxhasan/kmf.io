import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const app = window.app;
const auth = getAuth(app);
const db = getFirestore(app);

const AREAS = [ /* ... same as before ... */ ];

function generateDefaultWorkers() {
  return Array.from({ length: 15 }, (_, i) => ({ name: `Worker ${i + 1}` }));
}
function generateDefaultSkills() {
  let skills = {};
  AREAS.forEach(area => {
    skills[area.name] = {};
    area.items.forEach(item => {
      skills[area.name][item.name] = Array(15).fill(0);
    });
  });
  return skills;
}

let state = {
  workers: generateDefaultWorkers(),
  skills: generateDefaultSkills(),
  user: null,
  uid: null,
};

function skillLevelClass(level) {
  if (level >= 9) return "skill-high";
  if (level >= 5) return "skill-medium";
  return "skill-low";
}

async function saveToFirebase() {
  if (!state.uid) return;
  await setDoc(doc(db, "users", state.uid), {
    workers: state.workers,
    skills: state.skills,
    ts: Date.now()
  });
}

async function loadFromFirebase(uid) {
  let docRef = doc(db, "users", uid);
  let docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    let data = docSnap.data();
    if (Array.isArray(data.workers) && data.skills && data.workers.length === 15) {
      state.workers = data.workers;
      state.skills = data.skills;
      return true;
    }
  }
  // If no data, save defaults
  state.workers = generateDefaultWorkers();
  state.skills = generateDefaultSkills();
  await saveToFirebase();
  return false;
}

// Render UI, disables editing if not logged in
function renderAreas() {
  const container = document.getElementById("areas-container");
  container.innerHTML = "";

  AREAS.forEach(area => {
    let block = document.createElement("div");
    block.className = "area-block";
    let table = `
      <h2>${area.name}</h2>
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Worker</th>
            ${area.items.map(item => `<th>${item.name}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${state.workers.map((worker, rowIdx) => `
            <tr>
              <td class="worker-name ${state.user ? 'editable' : 'disabled'}" data-row="${rowIdx}">
                ${worker.name}
              </td>
              ${area.items.map(item => {
                const lvl = state.skills[area.name][item.name][rowIdx] || 0;
                return `<td
                  tabindex="0"
                  class="skill-level-cell ${skillLevelClass(lvl)} ${state.user ? 'editable' : 'disabled'}"
                  data-area="${area.name}"
                  data-item="${item.name}"
                  data-row="${rowIdx}">
                  ${lvl}
                </td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    block.innerHTML = table;
    container.appendChild(block);
  });
  addEventHandlers();
}

// Editing worker name
let currentEditRow = null;
function openEditNameModal(rowIdx) {
  if (!state.user) return; // Only if logged in!
  currentEditRow = rowIdx;
  document.getElementById("edit-name-input").value = state.workers[rowIdx].name;
  document.getElementById("edit-name-modal").style.display = "flex";
  setTimeout(() => document.getElementById("edit-name-input").focus(), 80);
}
function closeEditNameModal() {
  document.getElementById("edit-name-modal").style.display = "none";
  currentEditRow = null;
}

// Add table click handlers -- allowed ONLY when logged in
function addEventHandlers() {
  if (state.user) {
    document.querySelectorAll(".worker-name.editable").forEach(el => {
      el.onclick = () => openEditNameModal(Number(el.dataset.row));
      el.title = "Click to edit worker name";
    });
    document.querySelectorAll(".skill-level-cell.editable").forEach(cell => {
      cell.onclick = () => {
        let v = prompt("Enter skill level (0-10):", cell.textContent);
        if (v === null) return;
        v = Math.max(0, Math.min(10, parseInt(v) || 0));
        cell.textContent = v;
        let area = cell.dataset.area, item = cell.dataset.item, rowIdx = Number(cell.dataset.row);
        state.skills[area][item][rowIdx] = v;
        cell.className = `skill-level-cell editable ${skillLevelClass(v)}`;
        saveToFirebase();
      };
      cell.title = "Click to edit skill level (0-10)";
    });
  } else {
    document.querySelectorAll(".worker-name.disabled").forEach(el => {
      el.title = "Login to edit";
      el.onclick = null;
    });
    document.querySelectorAll(".skill-level-cell.disabled").forEach(el => {
      el.title = "Login to edit";
      el.onclick = null;
    });
  }
}

// Modal buttons for editing worker name (unchanged)
document.getElementById("save-name-btn").onclick = function() {
  if (!state.user) return;
  let val = document.getElementById("edit-name-input").value.trim();
  if (val) {
    state.workers[currentEditRow].name = val;
    renderAreas();
    closeEditNameModal();
    saveToFirebase();
  }
};
document.getElementById("cancel-name-btn").onclick = function() { closeEditNameModal(); };
document.getElementById("edit-name-modal").onclick = function(e) {
  if (e.target.classList.contains("modal")) closeEditNameModal();
};

// =======================
// USERNAME/PASSWORD LOGIN
// =======================

// Show login modal
document.getElementById("login-btn").onclick = function() {
  document.getElementById("login-modal").style.display = "flex";
  document.getElementById("login-error").textContent = "";
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
  setTimeout(() => document.getElementById("login-username").focus(), 80);
};
document.getElementById("cancel-login-btn").onclick = function() {
  document.getElementById("login-modal").style.display = "none";
  document.getElementById("login-error").textContent = "";
};
document.getElementById("login-modal").onclick = function(e) {
  if (e.target.classList.contains("modal")) {
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("login-error").textContent = "";
  }
};

// Handle login form
document.getElementById("do-login-btn").onclick = async function() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errorDiv = document.getElementById("login-error");
  errorDiv.textContent = "";
  if (!username || !password) {
    errorDiv.textContent = "Please enter both username and password.";
    return;
  }
  try {
    // Lookup email from Firestore 'usernames' collection
    const userDoc = await getDoc(doc(db, "usernames", username));
    if (!userDoc.exists()) throw new Error("Username not found.");
    const email = userDoc.data().email;
    if (!email) throw new Error("No email registered for this username.");
    // Sign in
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById("login-modal").style.display = "none";
  } catch (err) {
    errorDiv.textContent = err.message;
  }
};

document.getElementById("logout-btn").onclick = function() {
  signOut(auth);
};

// User info (top right)
function showUserInfo(user) {
  const info = document.getElementById("user-info");
  info.textContent = user ? `Hi, ${user.displayName || user.email}` : '';
  document.getElementById("login-btn").style.display = user ? "none" : "";
  document.getElementById("logout-btn").style.display = user ? "" : "none";
}

// Firebase login state
onAuthStateChanged(auth, async function(user) {
  state.user = user || null;
  state.uid = user ? user.uid : null;
  showUserInfo(user);
  if (user) {
    await loadFromFirebase(state.uid);
    renderAreas();
  } else {
    state.workers = generateDefaultWorkers();
    state.skills = generateDefaultSkills();
    renderAreas();
  }
});

// Start up: draw blank table if not logged in
window.addEventListener("DOMContentLoaded", () => {
  renderAreas();
});
// Initialization (inside your JS main block)
onAuthStateChanged(auth, async (user) => {
  state.user = user;
  state.uid = user ? user.uid : null;

  if (user) {
    // If LOGGED IN: Load personal data from Firestore (or create it if missing)
    await loadFromFirebase(state.uid);
  } else {
    // NOT LOGGED IN: Show default demo data
    state.workers = generateDefaultWorkers();
    state.skills = generateDefaultSkills();
  }
  renderAreas(); // Always render!
  showUserInfo(user);
  document.getElementById("login-btn").style.display = user ? "none" : "inline-block";
  document.getElementById("logout-btn").style.display = user ? "inline-block" : "none";
});
