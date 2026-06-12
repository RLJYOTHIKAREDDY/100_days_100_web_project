
const taskInput = document.getElementById("task");
const taskTypeSelect = document.getElementById("task-category");
const eisenhowerSelect = document.getElementById("eisenhower-select");
const taskList = document.getElementById("notes-container");
const emptyState = document.getElementById("emptyState");
const documentsList = document.querySelector('.documents-list');

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");


let tasks = [];
let currentFilter = "all";


function loadFromStorage() {
  try {
    const saved = localStorage.getItem('todo-tasks');
    if (saved) tasks = JSON.parse(saved);
  } catch (e) {
    tasks = [];
  }
}

function saveToStorage() {
  try {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
  } catch (e) {}
}


function addTask() {
  const text = taskInput.value.trim();
  const category = taskTypeSelect.value;
  const eisenhower = eisenhowerSelect.value;

  if (!text) {
    showToast("⚠️ Please enter a task description!");
    return;
  }

  const newTask = {
    id: Date.now(),
    text: text,
    category: category || "Miscellaneous",
    eisenhower: eisenhower || "",
    completed: false
  };

  tasks.push(newTask);
  taskInput.value = "";
  taskTypeSelect.value = "";
  eisenhowerSelect.value = "";

  saveToStorage(); // FIX: persist to localStorage
  renderTasks();
  showToast("✅ Task added successfully!");
}

function toggleTask(id) {
  tasks = tasks.map(task => {
    if (task.id === id) return { ...task, completed: !task.completed };
    return task;
  });
  saveToStorage(); // FIX: persist
  renderTasks();
}

function deleteTask(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) {
    card.style.animation = "fadeOut 0.25s ease forwards";
    setTimeout(() => {
      tasks = tasks.filter(task => task.id !== id);
      saveToStorage(); // FIX: persist
      renderTasks();
    }, 250);
  }
}

function clearDone() {
  const previousLength = tasks.length;
  tasks = tasks.filter(task => !task.completed);
  if (tasks.length === previousLength) {
    showToast("ℹ️ No completed tasks to clear.");
  } else {
    saveToStorage(); // FIX: persist
    renderTasks();
    showToast("🧹 Cleared all finished tasks!");
  }
}


function filterTasks(buttonElement, filterValue) {
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  buttonElement.classList.add("active");
  currentFilter = filterValue;
  renderTasks();
}

function renderTasks() {
  const filteredTasks = tasks.filter(task => {
    if (currentFilter === "all") return true;
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "done") return task.completed;
    return task.category === currentFilter;
  });

  if (filteredTasks.length === 0) {
    taskList.innerHTML = "";
    if (emptyState) {
      taskList.appendChild(emptyState);
      emptyState.style.display = "flex";
    }
  } else {
    if (emptyState) emptyState.style.display = "none";
    taskList.innerHTML = "";

    filteredTasks.forEach((task, idx) => {
      const card = document.createElement("div");
      card.className = `notes` + (task.completed ? " completed" : "");
      card.setAttribute("data-id", task.id);
      card.style.setProperty("--i", idx);

      card.innerHTML = `
        <div class="note-row">
          <textarea class="note-text" onchange="updateTaskText(${task.id}, this.value)">${task.text}</textarea>
          <div class="note-actions">
            <div class="category-badge">${task.category}</div>
            ${task.eisenhower ? `<span class="priority-tag ${task.eisenhower}">${
              {"urgent-important":"Urgent & Important","important-only":"Important Only","urgent-only":"Urgent Only","neither":"Neither"}[task.eisenhower]
            }</span>` : ""}
            <button class="note-check" onclick="toggleTask(${task.id})">${task.completed ? '✓' : '✔'}</button>
            <button class="note-delete" onclick="deleteTask(${task.id})">Delete</button>
          </div>
        </div>
      `;
      taskList.appendChild(card);
    });
  }

  updateMetrics();
}

function updateTaskText(id, newText) {
  tasks = tasks.map(task => {
    if (task.id === id) return { ...task, text: newText.trim() || "Untitled Task" };
    return task;
  });
  saveToStorage(); 
}

function updateMetrics() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) progressText.innerText = `${done} / ${total} done`;
}


function showHome() {
  document.getElementById("nav-home").classList.add("active");
  document.getElementById("nav-documents").classList.remove("active");
  document.getElementById("home-tab").hidden = false;
  document.getElementById("home-tab").style.display = "block";
  document.getElementById("documents-tab").hidden = true;
  document.getElementById("documents-tab").style.display = "none";
}

function showDocuments() {
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-documents").classList.add("active");
  document.getElementById("home-tab").hidden = true;
  document.getElementById("home-tab").style.display = "none";
  document.getElementById("documents-tab").hidden = false;
  document.getElementById("documents-tab").style.display = "block";
}

const navHome = document.getElementById("nav-home");
const navDocuments = document.getElementById("nav-documents");
if (navHome) navHome.addEventListener("click", (e) => { e.preventDefault(); showHome(); });
if (navDocuments) navDocuments.addEventListener("click", (e) => { e.preventDefault(); showDocuments(); });


function applyTheme(themeName) {
  document.body.classList.remove("theme1","theme2","theme3","theme4","theme5");
  document.body.classList.add(themeName);
  document.querySelectorAll(".theme-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-theme="${themeName}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  try { localStorage.setItem('todo-theme', themeName); } catch (e) {}
}

document.querySelectorAll(".theme-btn").forEach(button => {
  button.addEventListener("click", () => {
    const theme = button.dataset.theme;
    if (!theme) return;
    applyTheme(theme);
  });
});


function saveAsPDF() {
  if (tasks.length === 0) {
    showToast("❌ Cannot export empty list!");
    return;
  }

  const snapshot = [...tasks];
  const doneCount = snapshot.filter(t => t.completed).length;
  const pendingCount = snapshot.length - doneCount;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("TaskFlow Agenda Report", 20, 24);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 32);
  doc.text(`Tasks: ${snapshot.length} total  |  ${doneCount} done  |  ${pendingCount} pending`, 20, 38);
  doc.line(20, 42, 190, 42);

  let verticalCursor = 52;
  doc.setFontSize(12);

  snapshot.forEach((task, index) => {
    if (verticalCursor > 270) { doc.addPage(); verticalCursor = 20; }
    const status = task.completed ? "[DONE]" : "[PENDING]";
    const printLine = `${index + 1}. ${status} (${task.category}) — ${task.text}`;
    doc.text(printLine, 20, verticalCursor);
    verticalCursor += 10;
  });

  const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fileName = `TaskFlow_${Date.now()}.pdf`;
  const fileURL = URL.createObjectURL(doc.output("blob"));

  appendDocumentToList(fileName, fileURL, snapshot.length, doneCount, timeLabel);
  showToast(`📥 Saved ${snapshot.length} task${snapshot.length !== 1 ? 's' : ''} to Documents!`);
  showDocuments();
}

function appendDocumentToList(fileName, fileURL, taskCount, doneCount, timeLabel) {
  const docEmptyState = document.getElementById("emptyDocsState");
  if (docEmptyState) docEmptyState.style.display = "none";

  const docItem = document.createElement("div");
  docItem.className = "doc-item";
  docItem.innerHTML = `
    <div class="doc-icon">📄</div>
    <div class="doc-info">
      <div class="doc-name">${fileName}</div>
      <div class="doc-meta">
        <span class="doc-date">${new Date().toLocaleDateString()} ${timeLabel || ''}</span>
        <span class="doc-task-count">${taskCount} task${taskCount !== 1 ? 's' : ''} · ${doneCount} done</span>
      </div>
    </div>
    <div class="doc-actions">
      <button class="doc-btn" onclick="window.open('${fileURL}', '_blank')">View</button>
      <a class="doc-btn" href="${fileURL}" download="${fileName}" style="text-decoration:none;display:inline-block;text-align:center;">Download</a>
      <button class="doc-btn del" onclick="removeDocumentItem(this)">Delete</button>
    </div>
  `;
  documentsList.prepend(docItem);
}

function removeDocumentItem(button) {
  button.closest(".doc-item").remove();
  if (documentsList.children.length === 0) {
    const docEmptyState = document.getElementById("emptyDocsState");
    if (docEmptyState) docEmptyState.style.display = "flex";
  }
}


function showToast(message) {
  const toast = document.getElementById("pdfMessage");
  if (!toast) return;
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}


const taskForm = document.getElementById('task-form');
if (taskForm) taskForm.addEventListener('submit', (e) => { e.preventDefault(); addTask(); });

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addTask(); }
});

const savePdfBtn = document.getElementById('savepdf');
if (savePdfBtn) savePdfBtn.addEventListener('click', () => saveAsPDF());


loadFromStorage();
showHome();
try {
  const saved = localStorage.getItem('todo-theme');
  applyTheme(saved || 'theme1');
} catch (e) {
  applyTheme('theme1');
}
renderTasks();
