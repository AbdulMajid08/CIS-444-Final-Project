const journalTableBody = document.getElementById("journalTableBody");
const newEntryBtn = document.getElementById("newEntryBtn");

//load entries from local storage
function getEntries() {
  const entries = localStorage.getItem("journalEntries");
  return entries ? JSON.parse(entries) : [];
}

//save entries to local storage
function saveEntries(entries) {
  localStorage.setItem("journalEntries", JSON.stringify(entries));
}

//display entries
function displayEntries() {
  const entries = getEntries();
  journalTableBody.innerHTML = "";

if (entries.length === 0) {
  journalTableBody.innerHTML =
    <tr>
      <td colspan="4">No journal entries yet.</td>
    </tr>
  ;
  return;
}

entries.forEach((entry, index) => {
  const row = document.createElement("tr");
  
  row.innerHTML =
    <td>${entry.date}</td>
    <td>${entry.title}</td>
    <td>${entry.mood}</td>
  <td>
    <button class="edit-btn" onclick="editEntry(${index})">Edit</button>
    <button class="delete-btn" onclick="deleteEntry(${index})">Delete</button>
  </td>
  ;

  journalTableBody.appendChild(row);
});
                  
