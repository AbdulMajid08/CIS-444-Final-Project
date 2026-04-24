import "../js/api.js";

const journalTableBody = document.getElementById("journalTableBody");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function displayEntries(entries) {
  journalTableBody.innerHTML = "";

  if (!entries || entries.length === 0) {
    journalTableBody.innerHTML = `
      <tr>
        <td colspan="4">No journal entries yet.</td>
      </tr>
    `;
    return;
  }

  entries.forEach(function (entry) {
    const id = entry.id;
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(entry.date)}</td>
      <td>${escapeHtml(entry.title)}</td>
      <td>${escapeHtml(entry.mood)}</td>
      <td>
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="delete-btn">Delete</button>
      </td>
    `;
    row.querySelector(".edit-btn").addEventListener("click", function () {
      window.location.href =
        "../journal/index.html?edit=" + encodeURIComponent(String(id));
    });
    row.querySelector(".delete-btn").addEventListener("click", function () {
      deleteEntry(String(id));
    });

    journalTableBody.appendChild(row);
  });
}

async function refreshEntries() {
  try {
    const data = await api.listJournal();
    displayEntries(data.entries);
  } catch (err) {
    console.error(err);
    journalTableBody.innerHTML = `
      <tr>
        <td colspan="4">Could not load entries. Check the browser console and Firebase setup.</td>
      </tr>
    `;
  }
}

async function deleteEntry(entryId) {
  if (!confirm("Delete this journal entry?")) return;

  try {
    await api.deleteJournalEntry(entryId);
    await refreshEntries();
  } catch (err) {
    console.error(err);
    alert(err.message || "Could not delete entry.");
  }
}

document.getElementById("logoutBtn").addEventListener("click", function () {
  api.clearSession();
  window.location.href = "../login/index.html";
});

(async function initDashboard() {
  await api.waitForAuth();
  if (!api.getToken()) {
    window.location.href = "../login/index.html";
    return;
  }

  try {
    await api.me();
  } catch (err) {
    api.clearSession();
    window.location.href = "../login/index.html";
    return;
  }

  const u = api.getUser();
  const label = document.getElementById("userEmail");
  if (label && u && u.email) {
    label.textContent = "Signed in as " + u.email;
  }

  await refreshEntries();
})();
