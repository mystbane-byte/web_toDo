document.addEventListener("DOMContentLoaded", () => {
    // ===== Элементы DOM =====
    const taskForm = document.getElementById("task-form");
    const taskInput = document.getElementById("task-input");
    const taskCategory = document.getElementById("task-category");
    const taskPriority = document.getElementById("task-priority");
    const taskList = document.getElementById("task-list");

    const categoryFilter = document.getElementById("category-filter");
    const priorityFilter = document.getElementById("priority-filter");
    const statusFilter = document.getElementById("status-filter");
    const applyFiltersBtn = document.getElementById("apply-filters");
    const clearFiltersBtn = document.getElementById("clear-filters");

    const totalTasksEl = document.getElementById("total-tasks");
    const completedTasksEl = document.getElementById("completed-tasks");
    const pendingTasksEl = document.getElementById("pending-tasks");
    const highPriorityTasksEl = document.getElementById("high-priority-tasks");
    const suggestionText = document.getElementById("suggestion-text");

    // ===== Данные =====
    const STORAGE_KEY = "smartTodoTasks";
    const FILTERS_KEY = "smartTodoFilters";
    let tasks = loadTasks();

    // ===== Хелперы =====
    function saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function loadTasks() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    function saveFilters() {
        const filters = {
            category: categoryFilter.value,
            priority: priorityFilter.value,
            status: statusFilter.value,
        };
        localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
    }

    function loadFilters() {
        const filters = JSON.parse(localStorage.getItem(FILTERS_KEY));
        if (!filters) return;

        categoryFilter.value = filters.category || "all";
        priorityFilter.value = filters.priority || "all";
        statusFilter.value = filters.status || "all";
    }

    function getCategoryName(key) {
        const categories = {
            work: "Работа",
            personal: "Личное",
            shopping: "Покупки",
            health: "Здоровье",
            education: "Обучение",
        };
        return categories[key] || "Без категории";
    }

    function getPriorityName(key) {
        const priorities = {
            high: "Высокий",
            medium: "Средний",
            low: "Низкий",
        };
        return priorities[key] || "Нет";
    }

    // ===== Рендер задач =====
    function renderTasks() {
        const categoryValue = categoryFilter.value;
        const priorityValue = priorityFilter.value;
        const statusValue = statusFilter.value;

        const filteredTasks = tasks.filter((task) => {
            return (
                (categoryValue === "all" || task.category === categoryValue) &&
                (priorityValue === "all" || task.priority === priorityValue) &&
                (statusValue === "all" ||
                    (statusValue === "completed" && task.completed) ||
                    (statusValue === "active" && !task.completed))
            );
        });

        taskList.innerHTML = "";

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `<li class="empty-state">Задачи не найдены.</li>`;
            return;
        }

        filteredTasks.forEach((task) => {
            const li = document.createElement("li");
            li.className = `task-item ${task.completed ? "completed" : ""}`;
            li.dataset.id = task.id;

            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${
                    task.completed ? "checked" : ""
                }>
                <span class="task-text">${task.text}</span>
                <span class="task-category">${getCategoryName(task.category)}</span>
                <span class="task-priority priority-${task.priority}">
                    ${getPriorityName(task.priority)}
                </span>
                <div class="task-actions">
                    <button class="btn-edit">Редакт.</button>
                    <button class="btn-delete">Удалить</button>
                </div>
            `;

            taskList.appendChild(li);

            li.querySelector(".task-checkbox").addEventListener("change", () =>
                toggleTaskCompleted(task.id)
            );
            li.querySelector(".btn-edit").addEventListener("click", () =>
                editTask(task.id)
            );
            li.querySelector(".btn-delete").addEventListener("click", () =>
                deleteTask(task.id)
            );
        });
    }

    // ===== CRUD операции =====
    function addTask(text, category, priority) {
        const newTask = {
            id: Date.now(),
            text,
            category,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        updateSuggestions();
    }

    function toggleTaskCompleted(id) {
        tasks = tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
        updateStats();
        updateSuggestions();
    }

    function editTask(id) {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        const newText = prompt("Редактировать задачу:", task.text);
        if (newText && newText.trim() !== "") {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
            updateStats();
        }
    }

    function deleteTask(id) {
        if (!confirm("Удалить задачу?")) return;
        tasks = tasks.filter((task) => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        updateSuggestions();
    }

    // ===== Статистика =====
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        const pending = total - completed;
        const highPriority = tasks.filter(
            (t) => t.priority === "high" && !t.completed
        ).length;

        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
        highPriorityTasksEl.textContent = highPriority;
    }

    // ===== Умные подсказки =====
    function updateSuggestions() {
        const pendingTasks = tasks.filter((t) => !t.completed);

        if (pendingTasks.length === 0) {
            suggestionText.textContent = "Поздравляем! Все задачи выполнены.";
            return;
        }

        const highPriorityTasks = pendingTasks.filter(
            (t) => t.priority === "high"
        );
        if (highPriorityTasks.length > 0) {
            suggestionText.textContent = `У вас есть ${highPriorityTasks.length} высокоприоритетных задач, которые требуют внимания.`;
            return;
        }

        const oldTasks = pendingTasks.filter((t) => {
            const daysDiff =
                (new Date() - new Date(t.createdAt)) / (1000 * 60 * 60 * 24);
            return daysDiff > 7;
        });

        if (oldTasks.length > 0) {
            suggestionText.textContent = `У вас есть ${oldTasks.length} задач, ожидающих выполнения более недели.`;
            return;
        }

        suggestionText.textContent = "Всё под контролем! Продолжайте в том же духе.";
    }

    // ===== События =====
    taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        const category = taskCategory.value;
        const priority = taskPriority.value;

        if (!text) return;
        addTask(text, category, priority);

        taskInput.value = "";
        taskInput.focus();
    });

    applyFiltersBtn.addEventListener("click", () => {
        saveFilters();
        renderTasks();
    });

    clearFiltersBtn.addEventListener("click", () => {
        categoryFilter.value = "all";
        priorityFilter.value = "all";
        statusFilter.value = "all";
        saveFilters();
        renderTasks();
    });

    // ===== Инициализация =====
    loadFilters();
    renderTasks();
    updateStats();
    updateSuggestions();
});
