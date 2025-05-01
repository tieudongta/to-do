const form = document.getElementById('todo-form');
const input = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let searchQuery = '';
let sortMethod = 'default';

function renderTasks() {
  taskList.innerHTML = '';
  let sortedTasks = [...tasks];

	if (sortMethod === 'due-date') {
	  sortedTasks.sort((a, b) => {
		if (!a.dueDate) return 1;
		if (!b.dueDate) return -1;
		return new Date(a.dueDate) - new Date(b.dueDate);
	  });
	}

  sortedTasks.forEach((task, index) => {
    if (
	  (currentFilter === 'active' && task.completed) ||
	  (currentFilter === 'completed' && !task.completed) ||
	  (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase()))
	) {
	  return;
	}


    const li = document.createElement('li');
	li.className = task.completed ? 'completed' : '';
	li.setAttribute('draggable', true);
	li.setAttribute('data-index', index);
	li.addEventListener('dragstart', handleDragStart);
	li.addEventListener('dragover', handleDragOver);
	li.addEventListener('drop', handleDrop);
	li.addEventListener('dragend', handleDragEnd);

	li.innerHTML = `
	  <div class='task-left'>
		
		<div class="task-text">
		  <span contenteditable="true" onblur="editTask(${index}, this)" onkeydown="checkEnter(event)">
			${task.text}
		  </span>
		  ${task.dueDate ? `<small class="due-date ${getDateClass(task.dueDate)}">Due: ${task.dueDate}</small>` : ''}
		</div>
	  </div>
	  <div class="task-actions">
		<button onclick="toggleComplete(${index})">✔</button>
		<button class="delete-btn" onclick="deleteTask(${index})">✖</button>
	  </div>
	`;



    taskList.appendChild(li);
  });

  updateFilterButtons();
}

function addTask(e) {
  e.preventDefault();
  const text = input.value.trim();
  const dueInput = document.getElementById('due-date');
  const dueDate = dueInput.value;

  if (text === '') return;

  tasks.push({ text, completed: false, dueDate });
  input.value = '';
  dueInput.value = '';
  saveAndRender();
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  saveAndRender();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveAndRender();
}
function editTask(index, span) {
  const newText = span.textContent.trim();
  if (newText) {
    tasks[index].text = newText;
    saveAndRender();
  } else {
    // Optional: delete task if text is empty
    deleteTask(index);
  }
}
function checkEnter(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.target.blur(); // Triggers onblur -> editTask
  }
}

function saveAndRender() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

form.addEventListener('submit', addTask);
renderTasks();

function setFilter(filter) {
  currentFilter = filter;
  renderTasks();
}

function updateFilterButtons() {
  const buttons = document.querySelectorAll('.filters button');
  buttons.forEach(button => {
    button.classList.toggle('active', button.textContent.toLowerCase() === currentFilter);
  });
}

const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Load theme on startup
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);
function getDateClass(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr < today) return 'overdue';
  if (dateStr === today) return 'due-today';
  return '';
}
let dragStartIndex;

function handleDragStart(e) {
  dragStartIndex = +this.getAttribute('data-index');
  this.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault(); // Needed to allow drop
  this.classList.add('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const dropIndex = +this.getAttribute('data-index');
  swapTasks(dragStartIndex, dropIndex);
  saveAndRender();
}

function handleDragEnd() {
  document.querySelectorAll('li').forEach(item => {
    item.classList.remove('drag-over', 'dragging');
  });
}

function swapTasks(fromIndex, toIndex) {
  const temp = tasks[fromIndex];
  tasks[fromIndex] = tasks[toIndex];
  tasks[toIndex] = temp;
}

document.getElementById('search-input').addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTasks();
});
document.getElementById('sort-select').addEventListener('change', (e) => {
  sortMethod = e.target.value;
  renderTasks();
});
function getSelectedIndexes() {
  const checkboxes = document.querySelectorAll('.select-task:checked');
  return Array.from(checkboxes).map(cb => +cb.getAttribute('data-index'));
}

function bulkComplete() {
  const indexes = getSelectedIndexes();
  indexes.forEach(i => {
    if (tasks[i]) tasks[i].completed = true;
  });
  saveAndRender();
}

function bulkDelete() {
  const indexes = getSelectedIndexes().sort((a, b) => b - a); // reverse to prevent shifting
  indexes.forEach(i => {
    tasks.splice(i, 1);
  });
  saveAndRender();
}
