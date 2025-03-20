

// Global variable to track current filter
let filter = "all";

// Maximum number of tasks allowed
const MAX_TASKS = 5;

// Function to add a new task
function addItem(event) {
  event.preventDefault();
  console.log("addItem function called");

  const textInput = document.getElementById("todo-input");
  const text = textInput.value.trim();

  if (text === "") {
    console.log("Empty task, not adding");
    return;
  }

  // Check if we already have 5 active tasks
  db.collection("todo-items")
    .where("status", "==", "active")
    .get()
    .then((querySnapshot) => {
      const activeTasksCount = querySnapshot.size;
      console.log("Current active tasks:", activeTasksCount);

      if (activeTasksCount >= MAX_TASKS) {
        alert(
          `You can only have ${MAX_TASKS} active tasks at a time. Please complete some existing tasks first.`
        );
        return;
      }

      console.log("Adding task:", text);

      // Add to Firestore
      return db.collection("todo-items").add({
        text: text,
        status: "active",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then((docRef) => {
      if (docRef) {
        console.log("Task added successfully with ID:", docRef.id);
        textInput.value = ""; // Clear input - this fixes issue #1
      }
    })
    .catch((error) => {
      console.error("Error adding task:", error);
      alert("Error adding task. Check console for details.");
    });
}

// Function to get items from Firestore
function getItems() {
  console.log("Getting items from Firestore");

  db.collection("todo-items")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        console.log("Snapshot received, docs count:", snapshot.docs.length);

        const items = [];
        snapshot.docs.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        console.log("Items retrieved:", items);
        generateItems(items);
      },
      (error) => {
        console.error("Error getting documents:", error);
      }
    );
}

// Function to generate HTML for items
function generateItems(items) {
  console.log("Generating items HTML");

  let filteredItems = items;

  // Apply filter
  if (filter === "active") {
    filteredItems = items.filter((item) => item.status === "active");
  } else if (filter === "completed") {
    filteredItems = items.filter((item) => item.status === "completed");
  }

  console.log("Filtered items:", filteredItems);

  // Generate HTML
  let itemsHTML = "";
  filteredItems.forEach((item) => {
    itemsHTML += `
            <div class="todo-item">
                <div class="check">
                    <div data-id="${item.id}" class="checkmark ${
      item.status === "completed" ? "checked" : ""
    }">
                        <img src="./images/icon-check.svg" alt="">
                    </div>
                </div>
                <div class="todo-text ${
                  item.status === "completed" ? "checked" : ""
                }">
                    ${item.text}
                </div>
            </div>
        `;
  });

  // Update DOM
  document.querySelector(".todo-items").innerHTML = itemsHTML;

  // Update items left counter
  const activeItemsCount = items.filter(
    (item) => item.status === "active"
  ).length;
  const remainingCount = MAX_TASKS - activeItemsCount;
  document.querySelector(".items-left").textContent = `${remainingCount} item${
    remainingCount !== 1 ? "s" : ""
  } left`;

  // Create event listeners for the newly added items
  createEventListeners();
}

// Function to create event listeners
function createEventListeners() {
  console.log("Creating event listeners");

  // Event listeners for checkmarks
  const todoCheckMarks = document.querySelectorAll(".todo-item .checkmark");
  todoCheckMarks.forEach((checkmark) => {
    checkmark.addEventListener("click", () => {
      markCompleted(checkmark.dataset.id);
    });
  });

  // Event listeners for filters
  const filterOptions = document.querySelectorAll(".items-status span");
  filterOptions.forEach((option) => {
    option.addEventListener("click", function () {
      // Remove active class from all options
      filterOptions.forEach((opt) => opt.classList.remove("active"));
      // Add active class to clicked option
      this.classList.add("active");

      // Set filter based on clicked option
      if (this.textContent === "All") {
        filter = "all";
      } else if (this.textContent === "Active") {
        filter = "active";
      } else if (this.textContent === "Completed") {
        filter = "completed";
      }

      // Refresh the list with the new filter
      getItems();
    });
  });

  // Event listener for Clear Completed
  document
    .querySelector(".items-clear")
    .addEventListener("click", clearCompleted);
}

// Function to mark a task as completed
function markCompleted(id) {
  console.log("Marking task as completed/active:", id);

  db.collection("todo-items")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const status = doc.data().status;
        const newStatus = status === "active" ? "completed" : "active";

        console.log(`Updating task ${id} from ${status} to ${newStatus}`);

        return db.collection("todo-items").doc(id).update({
          status: newStatus,
        });
      }
    })
    .then(() => {
      console.log("Task status updated successfully");
    })
    .catch((error) => {
      console.error("Error updating task status:", error);
    });
}

// Function to clear completed tasks
function clearCompleted() {
  console.log("Clearing completed tasks");

  db.collection("todo-items")
    .where("status", "==", "completed")
    .get()
    .then((querySnapshot) => {
      const batch = db.batch();
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    })
    .then(() => {
      console.log("Completed tasks cleared successfully");
    })
    .catch((error) => {
      console.error("Error clearing completed tasks:", error);
    });
}

// Theme toggle
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.querySelector(".theme img");

  if (body.classList.contains("light-theme")) {
    // Switch to dark theme
    body.classList.remove("light-theme");
    themeIcon.src = "./images/icon-sun.svg";
    document.querySelector(".background-image img").src =
      "./images/bg-desktop-dark.jpg";
  } else {
    // Switch to light theme
    body.classList.add("light-theme");
    themeIcon.src = "./images/icon-moon.svg";
    document.querySelector(".background-image img").src =
      "./images/bg-desktop-light.jpg";
  }
}

// Set initial counter
function setInitialCounter() {
  db.collection("todo-items")
    .where("status", "==", "active")
    .get()
    .then((querySnapshot) => {
      const activeTasksCount = querySnapshot.size;
      const remainingCount = MAX_TASKS - activeTasksCount;
      document.querySelector(
        ".items-left"
      ).textContent = `${remainingCount} item${
        remainingCount !== 1 ? "s" : ""
      } left`;
    })
    .catch((error) => {
      console.error("Error getting initial count:", error);
      // Default to showing 5 items left if there's an error
      document.querySelector(
        ".items-left"
      ).textContent = `${MAX_TASKS} items left`;
    });
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing app");

  // Set initial counter (5 items left)
  setInitialCounter();

  // Make sure form submission works
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", addItem);
  }

  const todoForm = document.getElementById("todo-form");
  if (todoForm) {
    todoForm.addEventListener("submit", addItem);
  }

  // Add event listener for the new todo input directly
  const todoInput = document.getElementById("todo-input");
  if (todoInput) {
    todoInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addItem(e);
      }
    });
  }

  // Add event listener for theme toggle
  const themeToggle = document.querySelector(".theme img");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Initialize items
  getItems();
});

// Add log to verify script is running
console.log("Script loaded successfully");
