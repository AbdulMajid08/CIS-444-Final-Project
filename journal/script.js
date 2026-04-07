const journalTableBody = document.getElementById("journalTableBody");
const newEntryBtn = document.getElementById("newEntryBtn");

// Load entries from localStorage
function getEntries() {
  const entries = localStorage.getItem("journalEntries");
  return entries ? JSON.parse(entries) : [];
}

// Save entries to localStorage
function saveEntries(entries) {
  localStorage.setItem("journalEntries", JSON.stringify(entries));
}

// Display entries
function displayEntries() {
  const entries = getEntries();
  journalTableBody.innerHTML = "";

  if (entries.length === 0) {
    journalTableBody.innerHTML = `
      <tr>
        <td colspan="4">No journal entries yet.</td>
      </tr>
    `;
    return;
  }

  entries.forEach((entry, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.title}</td>
      <td>${entry.mood}</td>
      <td>
        <button class="edit-btn" onclick="editEntry(${index})">Edit</button>
        <button class="delete-btn" onclick="deleteEntry(${index})">Delete</button>
      </td>
    `;

    journalTableBody.appendChild(row);
  });
}

function deleteEntry(index) {
  const entries = getEntries();
  entries.splice(index, 1);
  saveEntries(entries);
  displayEntries();
}

function editEntry(index) {
  const entries = getEntries();
  const newTitle = prompt("Edit title:", entries[index].title);

  if (newTitle !== null && newTitle.trim() !== "") {
    entries[index].title = newTitle;
    saveEntries(entries);
    displayEntries();
  }
}

newEntryBtn.addEventListener("click", () => {
  const title = prompt("Enter journal title:");
  const mood = prompt("Enter mood (🙂 😐 😢 etc):");

  if (!title || !mood) return;

  const newEntry = {
    date: new Date().toLocaleDateString(),
    title: title.trim(),
    mood: mood.trim()
  };

  const entries = getEntries();
  entries.push(newEntry);
  saveEntries(entries);
  displayEntries();
});

displayEntries();
