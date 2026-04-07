document.addEventListener('DOMContentLoaded', function() {

  // check if we are editing an existing entry
  const params = new URLSearchParams(window.location.search);
  const editIndex = params.get('edit');

  // if editing, load the existing entry into the textarea
  if (editIndex !== null) {
    const user = localStorage.getItem('currentUser');
    const entries = JSON.parse(localStorage.getItem('journalEntries_' + user) || '[]');
    const entry = entries[editIndex];
    if (entry) {
      document.getElementById('writing').value = entry.text;
    }
  }

  document.getElementById('save-btn').addEventListener('click', function() {
    const text = document.getElementById('writing').value.trim();

    if (!text) {
      alert('Please write something before saving.');
      return;
    }

    const user = localStorage.getItem('currentUser');
    const entries = JSON.parse(localStorage.getItem('journalEntries_' + user) || '[]');

    if (editIndex !== null) {
      // update existing entry
      entries[editIndex].text = text;
    } else {
      // add new entry
      entries.push({
        date: new Date().toLocaleDateString(),
        title: 'Journal Entry',
        mood: '😐', // we need to add a button in the journal for the user to be able to select what mood he feels and it needs to reflect it
        text: text
      });
    }

    localStorage.setItem('journalEntries_' + user, JSON.stringify(entries));
    window.location.href = '../dashboard/index.html';
  });

});