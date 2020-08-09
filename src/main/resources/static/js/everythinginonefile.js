class Observable {
    constructor() {
        this._observers = [];
    }

    addObserver(o) {
        this._observers.push({ref: o});
    }

    /*
    *
    * @param {string} eventDescription,
    * @param {object} message
    *
    * */
    notifyAll(eventDescription, message) {
        this._observers.forEach(function (element) {
            element.ref.update(eventDescription, message);
        });
    }
}

/**
 * @param {string} templateId
 * @param {Object.<string, *>} templateData
 * @return {ChildNode}
 */
function createFromTemplate(templateId, templateData) {
    const scriptElement = document.querySelector(`#${templateId}`);
    const templateAsString = scriptElement.innerHTML;

    const templateWithData = templateAsString.replace(/{([^{}]*)}/g, (foundSubstring, dataKey) => {
        const result = templateData[dataKey];

        return typeof result === 'string'
        || typeof result === 'number'
            ? result
            : foundSubstring;
    });

    const div = document.createElement('div');
    div.innerHTML = templateWithData;

    return div.children[0];
}

class View extends Observable {
    constructor() {
        super();
        this._todoListElement = document.querySelector('.todos-list');
        this._todoCreator = document.querySelector(".todo-creator");
        this._todosToolbarUnreadyCounter = document.querySelector(".todos-toolbar_unready-counter");
        this._todoBoard = document.querySelector(".todo-board");
        this._allButton = document.querySelector(".filters-item-all");
        this._completedButton = document.querySelector(".filters-item-completed");
        this._activeButton = document.querySelector(".filters-item-active");
    }

    /*
    * @param {string} text
    * @param {boolean} isVisible
    * */
    addTodo(text, isVisible) {
        const newItemHTML = createFromTemplate(
            'listItem',
            {
                text: text,
            }
        );
        if (isVisible) {
            this.setVisible(newItemHTML);
        } else {
            this.setInvisible(newItemHTML);
        }
        this._todoListElement.appendChild(newItemHTML);
        this._todoCreator.reset();
        this.notifyAll("todo added", "");
    }

    /*
    * @param {number} amount
    * */
    updateAmountOfUndoneTasks(amount) {
        if (amount === 1) {
            this._todosToolbarUnreadyCounter.innerHTML = "1 item left";
        } else {
            this._todosToolbarUnreadyCounter.innerHTML = amount + " items left";
        }
    }

    deleteTodo(item) {
        item.parentNode.removeChild(item);
    }

    makeItemDone(item) {
        let task = item.querySelector(".todos-list_item_text");
        item.classList.add("__done");
        task.classList.add("line-through");
    }

    makeItemUndone(item) {
        let task = item.querySelector(".todos-list_item_text");
        item.classList.remove("__done");
        task.classList.remove("line-through");
    }

    expandBoard() {
        this._todoBoard.classList.add("__has-content");
    }

    shrinkBoard() {
        this._todoBoard.classList.remove("__has-content");
    }

    deleteDoneItems() {
        const checkboxes = document.querySelectorAll(".custom-checkbox_target");
        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                let item = checkboxes[i].closest(".todos-list_item");
                this.deleteTodo(item);
            }
        }
    }

    makeAllItemsDone() {
        const checkboxes = document.querySelectorAll(".custom-checkbox_target");
        for (let i = 0; i < checkboxes.length; i++) {
            if (!checkboxes[i].checked) {
                checkboxes[i].checked = true;
                let item = checkboxes[i].closest(".todos-list_item");
                this.makeItemDone(item);
            }
        }
    }

    makeAllItemsUndone() {
        const checkboxes = document.querySelectorAll(".custom-checkbox_target");
        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                checkboxes[i].checked = false;
                let item = checkboxes[i].closest(".todos-list_item");
                this.makeItemUndone(item);
            }
        }
    }

    makeAllItemsVisible() {
        let children = this._todoListElement.children;
        for (let i = 0; i < children.length; i++) {
            if (children[i].classList.contains("__hidden")) {
                children[i].classList.remove("__hidden");
            }
        }
    }

    makeOnlyDoneItemsVisible() {
        let children = this._todoListElement.children;
        for (let i = 0; i < children.length; i++) {
            if (children[i].classList.contains("__done")) {
                children[i].classList.remove("__hidden");
            } else {
                children[i].classList.add("__hidden");
            }
        }
    }

    makeOnlyUndoneItemsVisible() {
        let children = this._todoListElement.children;
        for (let i = 0; i < children.length; i++) {
            if (children[i].classList.contains("__done")) {
                children[i].classList.add("__hidden");
            } else {
                children[i].classList.remove("__hidden");
            }
        }
    }

    setInvisible(item) {
        if (!item.classList.contains("__hidden")) {
            item.classList.add("__hidden");
        }
    }

    setVisible(item) {
        if (item.classList.contains("__hidden")) {
            item.classList.remove("__hidden");
        }
    }

    unselectButton(name) {
        switch (name) {
            case "all":
                this._allButton.classList.remove("__selected");
                break;
            case "active": this._activeButton.classList.remove("__selected");
                break;
            case "completed":
                this._completedButton.classList.remove("__selected");
                break;
        }
    }

    selectButton(name) {
        switch (name) {
            case "all": this._allButton.classList.add("__selected");
                break;
            case "active": this._activeButton.classList.add("__selected");
                break;
            case "completed": this._completedButton.classList.add("__selected");
                break;
        }
    }
}

class Model {
    constructor(view) {
        this._tasksTotal = 0;
        this._doneTasksTotal = 0;
        this._view = view;
        this._mode = "all";
    }

    /*
    * @param {string} eventDescription,
    * @param {object} message
    *
    * */
    update(eventDescription, message) {
        switch (eventDescription) {
            case "addition request":
                this.addTask(message);
                break;
            case "deletion request":
                this.deleteTask(message);
                break;
            case "checkbox touched":
                this.processChecking(message);
                break;
            case "check all clicked":
                this.checkAll();
                break;
            case "switched to all":
                this.all();
                break;
            case "switched to completed":
                this.completed();
                break;
            case "switched to active":
                this.active();
                break;
            case "request to clear completed":
                this.clearCompleted();
                break;
        }
    }

    /*
    * @param {string} text
    *
    * */
    addTask(text) {
        if (text !== "") {
            if (this._tasksTotal === 0) {
                this._view.expandBoard();
            }
            this._tasksTotal++;
            this._view.addTodo(text, this._mode !== "completed");
            this.renderAmountOfUnreadyTasks();
        }
    }

    deleteTask(item) {
        this._tasksTotal--;
        if (this._tasksTotal === 0) {
            this._view.shrinkBoard();
        }
        if (item.classList.contains("__done")) {
            this._doneTasksTotal--;
        }
        this.renderAmountOfUnreadyTasks();
        this._view.deleteTodo(item);
    }

    processChecking(checkbox) {
        let item = checkbox.closest(".todos-list_item");
        if (checkbox.checked) {
            this._doneTasksTotal++;
            this._view.makeItemDone(item);
            if (this._mode === "active") {
                this._view.setInvisible(item);
            }
        } else {
            this._doneTasksTotal--;
            this._view.makeItemUndone(item);
            if (this._mode === "completed") {
                this._view.setInvisible(item);
            }
        }
        this.renderAmountOfUnreadyTasks();
    }

    renderAmountOfUnreadyTasks() {
        this._view.updateAmountOfUndoneTasks(this._tasksTotal - this._doneTasksTotal);
    }

    clearCompleted() {
        this._view.deleteDoneItems();
        this._tasksTotal-=this._doneTasksTotal;
        this._doneTasksTotal = 0;
        if (this._tasksTotal === 0) {
            this._view.shrinkBoard();
        }
    }

    checkAll() {
        if (this._tasksTotal !== this._doneTasksTotal) {
            this._doneTasksTotal = this._tasksTotal;
            this._view.makeAllItemsDone();
            this.renderAmountOfUnreadyTasks();
        } else {
            this._doneTasksTotal = 0;
            this.renderAmountOfUnreadyTasks();
            this._view.makeAllItemsUndone();
        }
        switch (this._mode) {
            case "all":
                this._view.makeAllItemsVisible();
                break;
            case "completed":
                this._view.makeOnlyDoneItemsVisible();
                break;
            case "active":
                this._view.makeOnlyUndoneItemsVisible();
                break;
        }
    }

    all() {
        if (this._mode !== "all") {
            this.unselectCurrentButton();
            this._mode = "all";
            this._view.makeAllItemsVisible();
            this.selectCurrentButton();
        }
    }

    completed() {
        if (this._mode !== "completed") {
            this.unselectCurrentButton();
            this._mode = "completed";
            this._view.makeOnlyDoneItemsVisible();
            this.selectCurrentButton();
        }
    }

    active() {
        if (this._mode !== "active") {
            this.unselectCurrentButton();
            this._mode = "active";
            this._view.makeOnlyUndoneItemsVisible();
            this.selectCurrentButton();
        }
    }

    unselectCurrentButton() {
        this._view.unselectButton(this._mode);
    }

    selectCurrentButton() {
        this._view.selectButton(this._mode);
    }
}

class Controller extends Observable {
    constructor() {
        super();

        this._todoCreatorTextInput = document.querySelector(".todo-creator_text-input");
        this._todoCreatorTextInput.addEventListener("keydown", this.textInputListener.bind(this));

        this._checkAllButton = document.querySelector(".todo-creator_check-all");
        this._checkAllButton.addEventListener("click", this.checkAllButtonListener.bind(this));

        this._allButton = document.querySelector(".filters-item-all");
        this._allButton.addEventListener("click", this.allButtonListener.bind(this));

        this._completedButton = document.querySelector(".filters-item-completed");
        this._completedButton.addEventListener("click", this.completedButtonListener.bind(this));

        this._activeButton = document.querySelector(".filters-item-active");
        this._activeButton.addEventListener("click", this.activeButtonListener.bind(this));

        this._clearCompletedButton = document.querySelector(".todos-toolbar_clear-completed");
        this._clearCompletedButton.addEventListener("click", this.clearCompletedButtonListener.bind(this));
    }

    textInputListener(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            let task = this._todoCreatorTextInput.value.trim();
            this.notifyAll("addition request", task);
        }
    }

    checkAllButtonListener(e) {
        e.preventDefault();
        this.notifyAll("check all clicked", "");
    }

    allButtonListener(e) {
        this.notifyAll("switched to all", "");
    }

    completedButtonListener(e) {
        this.notifyAll("switched to completed", "");
    }

    activeButtonListener(e) {
        this.notifyAll("switched to active", "");
    }

    clearCompletedButtonListener(e) {
        this.notifyAll("request to clear completed", "");
    }

    /*
     * @param {string} eventDescription,
     * @param {object} message
     *
     * */
    update(eventDescription, message) {
        switch (eventDescription) {
            case "todo added":
                this.addListenersToLastTodo();
                break;
        }
    }

    addListenersToLastTodo() {
        let todosList = document.querySelector(".todos-list");
        let deleteButtons = todosList.querySelectorAll(".custom-delete-button");
        let checkboxes = todosList.querySelectorAll('.custom-checkbox_target');
        deleteButtons[deleteButtons.length - 1].addEventListener("click", this.deleteButtonListener.bind(this));
        checkboxes[checkboxes.length - 1].addEventListener('click', this.checkboxListener.bind(this));
    }

    deleteButtonListener(e) {
        e.preventDefault();
        let trg = e.target;
        let task = trg.closest(".todos-list_item");
        this.notifyAll("deletion request", task);
    }

    checkboxListener(e) {
        let trg = e.target;
        this.notifyAll("checkbox touched", trg);
    }
}

function main() {
    const todoView = new View();
    const todoModel = new Model(todoView);
    const todoController = new Controller();

    todoView.addObserver(todoController);
    todoController.addObserver(todoModel);
}

main();