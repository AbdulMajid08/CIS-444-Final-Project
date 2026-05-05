import "../js/api.js";

// here we have this so that we can make sure that the user is authenticated and when they are we can have the stystem allow them to see their journal entries
// this way they only have access to their own entries and not others 
document.addEventListener("DOMContentLoaded", function () {
  (async function initJournal() {
    await api.waitForAuth();

    // if not authenticated we simply send them back to the login page
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

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");

    const titleInput = document.getElementById("entry-title");
    const heading = document.getElementById("page-heading");

    // this allows for our user to edit each journal entry that exists and then we save the new entry data to the db when the save button is clicked
    if (editId) {
      heading.textContent = "Edit Entry";
      try {
        const data = await api.getJournalEntry(editId);
        if (data.entry) {
          titleInput.value = data.entry.title || "";
          document.getElementById("writing").value = data.entry.text || "";
          document.getElementById("mood").value = data.entry.mood || "😐";
        }
      } catch (err) {
        // here we just make sure that if the loading fails we dont change the form and we present an error
      }
    }

    // now we have the save button which when used it submits the journal etnry for either creation or updation
    document.getElementById("save-btn").addEventListener("click", async function () {
      const title = titleInput.value.trim();
      const text = document.getElementById("writing").value.trim();

      // simple check to make suer that we are not saving an empty entry
      if (!text) {
        alert("Please write something in the journal before saving.");
        return;
      }

      const resolvedTitle = title || "Journal Entry";
      const dateStr = new Date().toLocaleDateString();
      

      try {
        if (editId) {
          await api.updateJournalEntry(editId, {
            text: text,
            date: dateStr,
            title: resolvedTitle,
            mood: document.getElementById("mood").value,
          });
        } else {
          await api.createJournalEntry({
            text: text,
            date: dateStr,
            title: resolvedTitle,
            mood: document.getElementById("mood").value,
          });
        }

        // once the user decides to save the entry we send them back to the dashboard page so they can view it
        window.location.href = "../dashboard/index.html";
      } catch (err) {
        console.error(err);
        alert(err.message || "Could not save entry.");
      }
    });
  })().catch(function (err) {
    // we have this in order to catch any errors that can occure during initialization
    console.error(err);
  });
});
