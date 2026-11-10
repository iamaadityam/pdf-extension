import"./styles-CP8UiGb0.js";import{t as e}from"./database-CceYqlYd.js";var t=null,n=[],r=document.getElementById(`doc-title`),i=document.getElementById(`notes-container`),a=document.getElementById(`search-input`);document.getElementById(`open-library-btn`).addEventListener(`click`,()=>{let e=chrome.runtime.getURL(`src/library/library.html`);chrome.tabs.create({url:e})}),a.addEventListener(`input`,()=>{c()});async function o(){let[n]=await chrome.tabs.query({active:!0,currentWindow:!0});if(!n||!n.id)return;let i=await e.getTabContext(n.id);if(i){t=i.documentId;let n=await e.getDocument(t);n&&(r.textContent=n.name),await s()}}async function s(){t&&(n=await e.getNotesForDocument(t),c())}function c(){if(!t||n.length===0){i.innerHTML=`
      <div style="color: var(--muted); text-align: center; margin-top: 24px;">
        No notes found for this PDF.
      </div>`;return}let e=a.value.toLowerCase().trim();i.innerHTML=n.filter(t=>t.capturedText.toLowerCase().includes(e)||t.comment.toLowerCase().includes(e)||t.tags.some(t=>t.toLowerCase().includes(e))).map(e=>`
    <div class="card" data-id="${e.id}">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="badge">${e.label}</span>
        <button class="btn btn-delete" style="padding: 2px 6px; font-size: 10px; color: var(--danger);">Delete</button>
      </div>

      <div class="captured-quote">${u(e.capturedText)}</div>

      <label style="font-size: 11px; color: var(--muted);">Page Reference</label>
      <input type="text" class="input-page" value="${u(e.pageReference||``)}" placeholder="e.g. 42 or p. 12">

      <label style="font-size: 11px; color: var(--muted);">Label</label>
      <select class="select-label">
        <option value="key_idea" ${e.label===`key_idea`?`selected`:``}>Key Idea</option>
        <option value="definition" ${e.label===`definition`?`selected`:``}>Definition</option>
        <option value="question" ${e.label===`question`?`selected`:``}>Question</option>
        <option value="quote" ${e.label===`quote`?`selected`:``}>Quote</option>
        <option value="other" ${e.label===`other`?`selected`:``}>Other</option>
      </select>

      <label style="font-size: 11px; color: var(--muted);">Comment</label>
      <textarea class="input-comment" placeholder="Add your notes or remarks...">${u(e.comment||``)}</textarea>

      <label style="font-size: 11px; color: var(--muted);">Tags (comma separated)</label>
      <input type="text" class="input-tags" value="${u(e.tags?e.tags.join(`, `):``)}" placeholder="analysis, key-term">
    </div>
  `).join(``),l()}function l(){document.querySelectorAll(`.card`).forEach(t=>{let r=t.dataset.id,i=n.find(e=>e.id===r);i&&(t.querySelector(`.btn-delete`)?.addEventListener(`click`,async()=>{await e.deleteNote(r),await s()}),t.querySelector(`.input-page`)?.addEventListener(`change`,async t=>{i.pageReference=t.target.value,await e.updateNote(i)}),t.querySelector(`.select-label`)?.addEventListener(`change`,async t=>{i.label=t.target.value,await e.updateNote(i)}),t.querySelector(`.input-comment`)?.addEventListener(`change`,async t=>{i.comment=t.target.value,await e.updateNote(i)}),t.querySelector(`.input-tags`)?.addEventListener(`change`,async t=>{let n=t.target.value;i.tags=n.split(`,`).map(e=>e.trim()).filter(Boolean),await e.updateNote(i)}))})}function u(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}chrome.runtime.onMessage.addListener(e=>{e.type===`NOTE_CAPTURED`&&o()}),o();