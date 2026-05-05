let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
let currentFilter = "all";
let searchQuery = "";
let editingId = null;

// =====================
//  DOM refs
// =====================
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const footerStats = document.getElementById("footerStats");
const btnExport = document.getElementById("btnExport");
const btnClear = document.getElementById("btnClear");
const progressFill = document.querySelector(".progress-fill");
const progressCount = document.querySelector(".progress-count");
const filterPills = document.querySelectorAll(".pill");
const searchBox = document.querySelector(".filter-searchbox");
const addBtn = document.querySelector(".header-top__cta-btn");

// =====================
//  Modal HTML
// =====================
function createModal() {
  const modal = document.createElement("div");
  modal.id = "taskModal";
  modal.innerHTML = `
  <div class="modal-overlay" id="modalOverlay">
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title" id="modalTitle">Thêm task mới</h2>
          <button class="modal-close" id="modalClose">
              <i class="fa-solid fa-x"></i>
            </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label"
              >Tên task <span class="required">*</span></label
            >
            <input
              type="text"
              id="inputName"
              class="form-input"
              placeholder="Nhập tên task..."
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Độ ưu tiên</label>
              <select id="inputPriority" class="form-input">
                <option value="high">🔴 High</option>
                <option value="mid" selected>🟡 Medium</option>
                <option value="low">🔵 Low</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Deadline</label>
              <input type="date" id="inputDeadline" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Tag</label>
            <input
              type="text"
              id="inputTag"
              class="form-input"
              placeholder="VD: Study, Work, Personal..."
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" id="btnCancel">Hủy</button>
          <button class="btn-save" id="btnSave">Lưu task</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  injectModalStyles();
}

function injectModalStyles() {
  const style = document.createElement("style");
  style.textContent = `
  /* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-card {
  background: #fff;
  border-radius: 18px;
  padding: 32px;
  width: 480px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.25s ease;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.modal-title {
  font-size: 2.4rem;
  color: #629c4e;
  font-weight: 700;
}
.modal-close {
  padding: 12px 16px;
  background: var(--milk-white);
  color: var(--dark-grey);
  font-size: 1.6rem;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;
  border: none;
  box-shadow: none;
  cursor: pointer;
}
.modal-close:hover {
  background: #e0e0c0;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-label {
  font-size: 1.4rem;
  font-weight: 600;
  color: #514c49;
}
.required {
  color: #e05252;
}
.form-input {
  padding: 12px 16px;
  border: 1.5px solid #ccc;
  border-radius: 10px;
  font-size: 1.6rem;
  outline: none;
  transition: border 0.15s;
  font-family: inherit;
}
.form-input:focus {
  border-color: #629c4e;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
.btn-cancel {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 1.6rem;
  font-weight: 600;
  background: #efefd3;
  color: #629c4e;
  border: 1px solid #629c4e;
  cursor: pointer;
}
.btn-save {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 1.6rem;
  font-weight: 700;
  background: #629c4e;
  color: #f4f5f6;
  border: none;
  cursor: pointer;
}
.btn-save:hover {
  background: #4e7d3e;
}

.task-item {
  animation: slideUp 0.2s ease;
}

.task-item.done .task-name {
  text-decoration: line-through;
  opacity: 0.6;
}`;
  document.head.appendChild(style);
}

// =====================
//  Save & Render
// =====================
function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function getFilteredTasks() {
  return tasks.filter((t) => {
    const matchFilter =
      currentFilter === "all" ||
      (currentFilter === "high" && t.priority === "high") ||
      (currentFilter === "mid" && t.priority === "mid") ||
      (currentFilter === "low" && t.priority === "low") ||
      (currentFilter === "deadline" && t.deadline && isOverdue(t.deadline));

    const matchSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.tag && t.tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchFilter && matchSearch;
  });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date(new Date().toDateString());
  const diff = (d - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function render() {
  // Remove all task items (keep emptyState)
  taskList.querySelectorAll(".task-item").forEach((el) => el.remove());

  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    emptyState.style.display = "flex";
  } else {
    emptyState.style.display = "none";
    filtered.forEach((task) => {
      taskList.appendChild(buildTaskEl(task));
    });
  }

  updateProgress();
  updateFooter();
}

function buildTaskEl(task) {
  const div = document.createElement("div");
  div.className = `task-item priority-${task.priority}${task.done ? " done" : ""}`;
  div.dataset.id = task.id;

  const deadlineClass = isOverdue(task.deadline)
    ? "overdue"
    : isUpcoming(task.deadline)
      ? "upcoming"
      : "";

  const deadlineHtml = task.deadline
    ? `<span class="task-deadline ${deadlineClass}">Due ${formatDate(task.deadline)}</span>`
    : "";

  const tagHtml = task.tag ? `<span class="task-tag">${task.tag}</span>` : "";

  const priorityLabel =
    task.priority === "high"
      ? "High"
      : task.priority === "mid"
        ? "Medium"
        : "Low";

  div.innerHTML = `
    <input class="task-checkbox" type="checkbox" ${task.done ? "checked" : ""} data-action="toggle" />
    <div class="task-body">
      <div class="task-title-row">
        <span class="task-name">${task.name}</span>
        <span class="priority-badge ${task.priority}">${priorityLabel}</span>
      </div>
      <div class="task-meta">
        ${deadlineHtml}
        ${tagHtml}
      </div>
    </div>
    <div class="task-menu">
      <button class="task-edit-btn" data-action="edit" title="Sửa">
        <i class="fa-regular fa-pen-to-square"></i>
      </button>
      <button class="task-delete-btn" data-action="delete" title="Xóa">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;

  // Add overdue style
  if (deadlineClass === "overdue") {
    const dl = div.querySelector(".task-deadline");
    if (dl) dl.style.color = "rgb(224,82,82)";
  }

  return div;
}

function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  progressFill.style.width = pct + "%";
  progressCount.textContent = `${done} / ${total} hoàn thành`;
}

function updateFooter() {
  const undone = tasks.filter((t) => !t.done).length;
  const overdue = tasks.filter((t) => !t.done && isOverdue(t.deadline)).length;
  footerStats.textContent = `${undone} chưa xong - ${overdue} quá hạn`;
}

// =====================
//  Modal Logic
// =====================
function openModal(task = null) {
  editingId = task ? task.id : null;
  document.getElementById("modalTitle").textContent = task
    ? "Sửa task"
    : "Thêm task mới";
  document.getElementById("inputName").value = task ? task.name : "";
  document.getElementById("inputPriority").value = task ? task.priority : "mid";
  document.getElementById("inputDeadline").value = task
    ? task.deadline || ""
    : "";
  document.getElementById("inputTag").value = task ? task.tag || "" : "";
  document.getElementById("taskModal").style.display = "block";
  setTimeout(() => document.getElementById("inputName").focus(), 50);
}

function closeModal() {
  document.getElementById("taskModal").style.display = "none";
  editingId = null;
}

function saveTask() {
  const name = document.getElementById("inputName").value.trim();
  if (!name) {
    document.getElementById("inputName").style.borderColor = "rgb(224,82,82)";
    document.getElementById("inputName").focus();
    return;
  }
  document.getElementById("inputName").style.borderColor = "";

  const priority = document.getElementById("inputPriority").value;
  const deadline = document.getElementById("inputDeadline").value;
  const tag = document.getElementById("inputTag").value.trim();

  if (editingId !== null) {
    const idx = tasks.findIndex((t) => t.id === editingId);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], name, priority, deadline, tag };
    }
  } else {
    tasks.push({
      id: Date.now(),
      name,
      priority,
      deadline,
      tag,
      done: false,
    });
  }

  save();
  render();
  closeModal();
}

// =====================
//  Event Delegation
// =====================
taskList.addEventListener("click", (e) => {
  const item = e.target.closest(".task-item");
  if (!item) return;
  const id = Number(item.dataset.id);
  const action = e.target.closest("[data-action]")?.dataset.action;

  if (action === "toggle" || e.target.classList.contains("task-checkbox")) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      save();
      render();
    }
  } else if (action === "edit") {
    const task = tasks.find((t) => t.id === id);
    if (task) openModal(task);
  } else if (action === "delete") {
    if (confirm("Xóa task này?")) {
      tasks = tasks.filter((t) => t.id !== id);
      save();
      render();
    }
  }
});

// Filter pills
filterPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    filterPills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.dataset.filter;
    render();
  });
});

// Search
searchBox.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  render();
});

// Add button
addBtn.addEventListener("click", () => openModal());

// Export
btnExport.addEventListener("click", () => {
  const rows = [["ID", "Name", "Priority", "Deadline", "Tag", "Done"]];
  tasks.forEach((t) =>
    rows.push([
      t.id,
      t.name,
      t.priority,
      t.deadline || "",
      t.tag || "",
      t.done,
    ]),
  );
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// Clear done
btnClear.addEventListener("click", () => {
  const count = tasks.filter((t) => t.done).length;
  if (count === 0) return alert("Không có task nào đã hoàn thành!");
  if (confirm(`Xóa ${count} task đã xong?`)) {
    tasks = tasks.filter((t) => !t.done);
    save();
    render();
  }
});

// Modal buttons (delegated from body)
document.addEventListener("click", (e) => {
  if (
    e.target.id === "modalClose" ||
    e.target.id === "btnCancel" ||
    e.target.id === "modalOverlay"
  ) {
    closeModal();
  }
  if (e.target.id === "btnSave") {
    saveTask();
  }
});

// Enter to save
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
  if (
    e.key === "Enter" &&
    document.getElementById("taskModal")?.style.display === "block"
  ) {
    saveTask();
  }
});

// =====================
//  Init
// =====================
createModal();
document.getElementById("taskModal").style.display = "none";
filterPills[0].classList.add("active"); // "All" active by default
render();
