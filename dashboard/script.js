import "../js/api.js";

// this is the table body element where journal rows will be inserted in our code
const journalTableBody = document.getElementById("journalTableBody");

// here we have the escaped text that our user provides text so it can be safely inserted into the HTML page part of the code
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

// this function here helps us render the journal entries into our dashboard
function displayEntries(entries) {
  journalTableBody.innerHTML = "";

  // this is a simple if statement to show if there are no entries yet
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

    // we use escapeHtml for any text that comes from our user and DB
    // this is in order to prevent XSS attacks, this way we insure that the HTML tags are shown only as text and not actual code
    row.innerHTML = `
      <td>${escapeHtml(entry.date)}</td>
      <td>${escapeHtml(entry.title)}</td>
      <td>${escapeHtml(entry.mood)}</td>
      <td>
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="delete-btn">Delete</button>
      </td>
    `;

    // this allows the user to navigate to the journal edit page if the feature is clicked
    row.querySelector(".edit-btn").addEventListener("click", function () {
      window.location.href =
        "../journal/index.html?edit=" + encodeURIComponent(String(id));
    });

    // if the user wants to delete the entry this allows for it
    row.querySelector(".delete-btn").addEventListener("click", function () {
      deleteEntry(String(id));
    });

    journalTableBody.appendChild(row);
  });
}

// we refresh the journal list here from the API for so that we can update the table
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

// once the user deletes the entry, we confirm its deletion here 
async function deleteEntry(entryId) {
  if (!confirm("Delete this journal entry?")) return;

  // we also call the API so that the delete is also happening in our firestore DB and not just on the webpage
  //then table is refresehd so we can see correct changes
  try {
    await api.deleteJournalEntry(entryId);
    await refreshEntries();
  } catch (err) {
    console.error(err);
    alert(err.message || "Could not delete entry.");
  }
}

// here we have this so that the logout feature can be handled if the user uses it
document.getElementById("logoutBtn").addEventListener("click", function () {
  api.clearSession();
  window.location.href = "../login/index.html";
});

// simple function that is used to initialize our dashboard when the page is loaded at start
(async function initDashboard() {
  await api.waitForAuth();

  
  // now here we haev to check for the users authentication token to make sure the user is signed in
  // and if not we have to send them back to the login page as a security measure, so other users cant see each others private journals
  if (!api.getToken()) {
    window.location.href = "../login/index.html";
    return;
  }



  // now we have this try so that we can confirm that the user token is still valid before we allow the user to access the dashboard screen
  // however, if this fails we have to clear our entire session and then send them back to user login
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
