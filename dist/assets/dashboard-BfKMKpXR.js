import"./api-harsJktA.js";const i=document.getElementById("journalTableBody");function r(e){const t=document.createElement("div");return t.textContent=e==null?"":String(e),t.innerHTML}function l(e){if(i.innerHTML="",!e||e.length===0){i.innerHTML=`
      <tr>
        <td colspan="4">No journal entries yet.</td>
      </tr>
    `;return}e.forEach(function(t){const n=t.id,o=document.createElement("tr");o.innerHTML=`
      <td>${r(t.date)}</td>
      <td>${r(t.title)}</td>
      <td>${r(t.mood)}</td>
      <td>
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="delete-btn">Delete</button>
      </td>
    `,o.querySelector(".edit-btn").addEventListener("click",function(){window.location.href="../journal/index.html?edit="+encodeURIComponent(String(n))}),o.querySelector(".delete-btn").addEventListener("click",function(){d(String(n))}),i.appendChild(o)})}async function a(){try{const e=await api.listJournal();l(e.entries)}catch(e){console.error(e),i.innerHTML=`
      <tr>
        <td colspan="4">Could not load entries. Check the browser console and Firebase setup.</td>
      </tr>
    `}}async function d(e){if(confirm("Delete this journal entry?"))try{await api.deleteJournalEntry(e),await a()}catch(t){console.error(t),alert(t.message||"Could not delete entry.")}}document.getElementById("logoutBtn").addEventListener("click",function(){api.clearSession(),window.location.href="../login/index.html"});(async function(){if(await api.waitForAuth(),!api.getToken()){window.location.href="../login/index.html";return}try{await api.me()}catch{api.clearSession(),window.location.href="../login/index.html";return}const t=api.getUser(),n=document.getElementById("userEmail");n&&t&&t.email&&(n.textContent="Signed in as "+t.email),await a()})();
