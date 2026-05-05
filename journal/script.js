import "../js/api.js";

document.addEventListener("DOMContentLoaded", function () {
  (async function initJournal() {
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

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");

    const titleInput = document.getElementById("entry-title");
    const heading = document.getElementById("page-heading");

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
        console.error(err);
      }
    }

    document.getElementById("save-btn").addEventListener("click", async function () {
      const title = titleInput.value.trim();
      const text = document.getElementById("writing").value.trim();

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
        window.location.href = "../dashboard/index.html";
      } catch (err) {
        console.error(err);
        alert(err.message || "Could not save entry.");
      }
    });
  })().catch(function (err) {
    console.error(err);
  });
});
