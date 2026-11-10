import"./styles-DrGfBDvu.js";import{t as e}from"./database-CceYqlYd.js";import{t}from"./url-lQQJDFvN.js";var n=null,r=null,i=[],a=`all`,o=document.getElementById(`doc-title`),s=document.getElementById(`notes-container`),c=document.getElementById(`search-input`),l=document.getElementById(`open-library-btn`),u=document.getElementById(`toast`),d=document.getElementById(`btn-toggle-add`),f=document.getElementById(`new-note-drawer`),p=document.getElementById(`drawer-cancel-btn`),m=document.getElementById(`drawer-save-btn`),h=document.getElementById(`drawer-text`),g=document.getElementById(`drawer-label`),_=document.getElementById(`drawer-page`),v=document.getElementById(`drawer-comment`),y=document.getElementById(`drawer-tags`);l.addEventListener(`click`,()=>{let e=chrome.runtime.getURL(`src/library/library.html`);chrome.tabs.create({url:e})}),c.addEventListener(`input`,()=>{w()}),document.querySelectorAll(`.filter-pill`).forEach(e=>{e.addEventListener(`click`,()=>{document.querySelectorAll(`.filter-pill`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),a=e.dataset.filter||`all`,w()})}),d.addEventListener(`click`,()=>{f.classList.toggle(`open`),f.classList.contains(`open`)&&h.focus()}),p.addEventListener(`click`,()=>{f.classList.remove(`open`),b()}),m.addEventListener(`click`,async()=>{let i=h.value.trim();if(!i){h.focus(),E(`Please enter quote or note text.`);return}if(!n||!r){let[i]=await chrome.tabs.query({active:!0,currentWindow:!0}),a=t(i?.url,i?.title),{document:o,source:s}=await e.findOrCreateSource(a.sourceKey,a.displayUrl,a.sourceType,a.derivedTitle);n=o.id,r=s.id,i?.id&&await e.setTabContext(i.id,o.id,s.id)}let a=y.value.split(`,`).map(e=>e.trim()).filter(Boolean);await e.addNote({documentId:n,sourceId:r,capturedText:i,pageReference:_.value.trim()||void 0,label:g.value,comment:v.value.trim(),tags:a}),b(),f.classList.remove(`open`),E(`Note added! 📝`),await S()});function b(){h.value=``,_.value=``,v.value=``,y.value=``,g.value=`key_idea`}async function x(){let[i]=await chrome.tabs.query({active:!0,currentWindow:!0});if(!i||!i.id)return;let a=await e.getTabContext(i.id);if(a){n=a.documentId,r=a.sourceId;let t=await e.getDocument(n);t&&(o.textContent=t.name,o.title=t.name),await S();return}let c=i.url||``;if(c.toLowerCase().includes(`.pdf`)||c.startsWith(`file://`)&&c.toLowerCase().endsWith(`.pdf`)){let a=t(c,i.title);o.textContent=a.derivedTitle,o.title=a.derivedTitle;let{document:s,source:l}=await e.findOrCreateSource(a.sourceKey,a.displayUrl,a.sourceType,a.derivedTitle);n=s.id,r=l.id,await e.setTabContext(i.id,s.id,l.id),await S()}else o.textContent=`PDF Notes`,s.innerHTML=`
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <div class="empty-state-title">No PDF detected</div>
        <div class="empty-state-text">
          Open any PDF in Chrome to capture highlights, or click <strong>Library</strong> to view all saved notes.
        </div>
      </div>
    `}async function S(){n&&(i=await e.getNotesForDocument(n),w())}var C={key_idea:{emoji:`💡`,name:`Key Idea`},definition:{emoji:`📖`,name:`Definition`},question:{emoji:`❓`,name:`Question`},quote:{emoji:`💬`,name:`Quote`},other:{emoji:`📝`,name:`Other`}};function w(){if(!n||i.length===0){s.innerHTML=`
      <div class="empty-state">
        <div class="empty-state-icon">✍️</div>
        <div class="empty-state-title">Ready for your first note</div>
        <div class="empty-state-text">
          Highlight any text on the PDF, right-click, and choose <strong>"Save to PDF Notes"</strong>.<br/><br/>
          Or click the <strong>+ Note</strong> button above to write your own!
        </div>
      </div>`;return}let e=c.value.toLowerCase().trim(),t=i.filter(t=>a!==`all`&&t.label!==a?!1:!e||t.capturedText.toLowerCase().includes(e)||t.comment&&t.comment.toLowerCase().includes(e)||t.pageReference&&t.pageReference.toLowerCase().includes(e)||t.tags&&t.tags.some(t=>t.toLowerCase().includes(e)));t.length===0?s.innerHTML=`
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No matching notes found</div>
        <div class="empty-state-text">Try searching for a different word or select "All" categories.</div>
      </div>`:(s.innerHTML=t.map(e=>{let t=C[e.label]||{emoji:`📝`,name:e.label};return`
    <div class="card" data-id="${e.id}">
      <div class="card-top">
        <div class="card-meta">
          <span class="badge badge-${e.label}">${t.emoji} ${t.name}</span>
          ${e.pageReference?`<span class="page-ref">📄 p. ${D(e.pageReference)}</span>`:``}
        </div>
        <button class="btn btn-ghost btn-sm btn-delete" style="color: var(--danger); padding: 2px 6px;" title="Delete this note">
          🗑️
        </button>
      </div>

      <div class="captured-quote">${D(e.capturedText)}</div>

      ${e.comment?`
        <div class="card-comment">
          <strong>✏️ Note:</strong> ${D(e.comment)}
        </div>
      `:``}

      ${e.tags&&e.tags.length>0?`
        <div style="margin-top: 4px;">
          ${e.tags.map(e=>`<span class="tag-chip">#${D(e)}</span>`).join(``)}
        </div>
      `:``}

      <div class="card-actions">
        <button class="btn btn-ghost btn-sm btn-edit" title="Edit note details">
          ✏️ Edit
        </button>
        <button class="btn btn-ghost btn-sm btn-copy" title="Copy formatted note to clipboard">
          📋 Copy
        </button>
      </div>

      <!-- Collapsible inline edit section -->
      <div class="edit-section" style="display: none; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border);">
        <label style="font-size: 11px; font-weight: 600; color: var(--muted);">Category</label>
        <select class="select-label" style="margin-bottom: 6px;">
          <option value="key_idea" ${e.label===`key_idea`?`selected`:``}>💡 Key Idea</option>
          <option value="definition" ${e.label===`definition`?`selected`:``}>📖 Definition</option>
          <option value="question" ${e.label===`question`?`selected`:``}>❓ Question</option>
          <option value="quote" ${e.label===`quote`?`selected`:``}>💬 Quote</option>
          <option value="other" ${e.label===`other`?`selected`:``}>📝 Other</option>
        </select>

        <label style="font-size: 11px; font-weight: 600; color: var(--muted);">Page Reference</label>
        <input type="text" class="input-page" value="${D(e.pageReference||``)}" placeholder="e.g. 42 or p. 12" style="margin-bottom: 6px;">

        <label style="font-size: 11px; font-weight: 600; color: var(--muted);">Comment</label>
        <textarea class="input-comment" placeholder="Add your notes or remarks..." style="margin-bottom: 6px;">${D(e.comment||``)}</textarea>

        <label style="font-size: 11px; font-weight: 600; color: var(--muted);">Tags (comma separated)</label>
        <input type="text" class="input-tags" value="${D(e.tags?e.tags.join(`, `):``)}" placeholder="exam, chapter2" style="margin-bottom: 8px;">

        <div style="display: flex; justify-content: flex-end; gap: 6px;">
          <button class="btn btn-sm btn-cancel-edit">Done</button>
        </div>
      </div>
    </div>
  `}).join(``),T())}function T(){document.querySelectorAll(`.card`).forEach(t=>{let n=t.dataset.id,r=i.find(e=>e.id===n);if(!r)return;t.querySelector(`.btn-delete`)?.addEventListener(`click`,async()=>{confirm(`Delete this note?`)&&(await e.deleteNote(n),E(`Note deleted`),await S())});let a=t.querySelector(`.btn-copy`);a?.addEventListener(`click`,()=>{let e=`"${r.capturedText}"`;r.pageReference&&(e+=` (p. ${r.pageReference})`),r.comment&&(e+=`\nNote: ${r.comment}`),navigator.clipboard.writeText(e).then(()=>{a.textContent=`Copied! ✓`,a.style.color=`var(--success)`,E(`Copied to clipboard! 📋`),setTimeout(()=>{a.textContent=`📋 Copy`,a.style.color=``},1800)})});let o=t.querySelector(`.edit-section`);t.querySelector(`.btn-edit`)?.addEventListener(`click`,()=>{let e=o.style.display!==`none`;o.style.display=e?`none`:`block`}),t.querySelector(`.btn-cancel-edit`)?.addEventListener(`click`,()=>{o.style.display=`none`}),t.querySelector(`.input-page`)?.addEventListener(`change`,async t=>{r.pageReference=t.target.value.trim(),await e.updateNote(r),await S(),E(`Updated page reference`)}),t.querySelector(`.select-label`)?.addEventListener(`change`,async t=>{r.label=t.target.value,await e.updateNote(r),await S(),E(`Updated category`)}),t.querySelector(`.input-comment`)?.addEventListener(`change`,async t=>{r.comment=t.target.value.trim(),await e.updateNote(r),await S(),E(`Updated comment`)}),t.querySelector(`.input-tags`)?.addEventListener(`change`,async t=>{let n=t.target.value;r.tags=n.split(`,`).map(e=>e.trim()).filter(Boolean),await e.updateNote(r),await S(),E(`Updated tags`)})})}function E(e){u.textContent=e,u.classList.add(`show`),setTimeout(()=>{u.classList.remove(`show`)},2200)}function D(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}chrome.runtime.onMessage.addListener(e=>{e.type===`NOTE_CAPTURED`&&(E(`New note captured! 📝`),x())}),x();