import"./styles-DrGfBDvu.js";import{t as e}from"./database-CceYqlYd.js";function t(e,t,n){let r=[];return r.push(`# ${e.name}`),r.push(`*Exported on ${new Date().toLocaleDateString()} — Total Notes: ${t.length}*\n`),n.length>0&&(r.push(`## Sources`),n.forEach(e=>r.push(`- [${e.displayUrl}](${e.displayUrl}) (${e.sourceType})`)),r.push(``)),r.push(`## Captured Notes
`),t.forEach((e,t)=>{r.push(`### Note ${t+1} [${e.label.toUpperCase()}]`),e.pageReference&&r.push(`**Page:** ${e.pageReference}`),r.push(`> ${e.capturedText.replace(/\n/g,`
> `)}\n`),e.comment&&r.push(`**Comment:** ${e.comment}\n`),e.tags&&e.tags.length>0&&r.push(`**Tags:** ${e.tags.map(e=>`#${e}`).join(` `)}\n`),r.push(`---
`)}),r.join(`
`)}function n(e,t){let n=`
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>${i(e.name)}</title>
    <style>
      body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
      h1 { font-size: 18pt; color: #1e293b; }
      h2 { font-size: 14pt; color: #334155; border-bottom: 1px solid #cbd5e1; }
      blockquote { background: #f8fafc; border-left: 4px solid #0284c7; margin: 10px 0; padding: 8px 12px; font-style: italic; }
      .meta { font-size: 9pt; color: #64748b; margin-top: 4px; }
      .label { font-weight: bold; color: #0369a1; text-transform: uppercase; }
    </style>
    </head>
    <body>
      <h1>${i(e.name)}</h1>
      <p class="meta">Exported on ${new Date().toLocaleDateString()} | ${t.length} Notes</p>
      <hr/>
      ${t.map((e,t)=>`
        <div>
          <h2>Note ${t+1} <span class="label">(${e.label})</span></h2>
          ${e.pageReference?`<p class="meta">Page Reference: ${i(e.pageReference)}</p>`:``}
          <blockquote>${i(e.capturedText).replace(/\n/g,`<br/>`)}</blockquote>
          ${e.comment?`<p><strong>Comment:</strong> ${i(e.comment)}</p>`:``}
          ${e.tags.length?`<p class="meta">Tags: ${i(e.tags.join(`, `))}</p>`:``}
        </div>
      `).join(`<br/>`)}
    </body>
    </html>
  `;return new Blob([`﻿`+n],{type:`application/msword`})}function r(e,t){let n=window.open(``,`_blank`);n&&(n.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${i(e.name)} - Notes</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 20px; line-height: 1.6; color: #1e293b; }
        h1 { font-size: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
        .note { border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
        .quote { background: #f8fafc; border-left: 4px solid #0284c7; padding: 10px; font-family: monospace; white-space: pre-wrap; margin: 8px 0; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .meta { font-size: 12px; color: #64748b; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${i(e.name)}</h1>
      <p class="meta">Exported on ${new Date().toLocaleDateString()} | Total Notes: ${t.length}</p>
      ${t.map(e=>`
        <div class="note">
          <div><span class="badge">${e.label.toUpperCase()}</span> ${e.pageReference?`<span class="meta">| Page ${i(e.pageReference)}</span>`:``}</div>
          <div class="quote">${i(e.capturedText)}</div>
          ${e.comment?`<p><strong>Comment:</strong> ${i(e.comment)}</p>`:``}
          ${e.tags.length?`<p class="meta">Tags: ${i(e.tags.join(`, `))}</p>`:``}
        </div>
      `).join(``)}
    </body>
    </html>
  `),n.document.close(),n.focus(),setTimeout(()=>{n.print(),n.close()},250))}function i(e){return e.replace(/[<>&'"]/g,e=>{switch(e){case`<`:return`&lt;`;case`>`:return`&gt;`;case`&`:return`&amp;`;case`'`:return`&apos;`;case`"`:return`&quot;`;default:return e}})}var a=[],o={},s=null,c=[],l=document.getElementById(`document-list`),u=document.getElementById(`main-view`),d=document.getElementById(`doc-search`),f=document.getElementById(`global-stats`),p=document.getElementById(`btn-export-json`),m=document.getElementById(`btn-import-json`),h=document.getElementById(`file-import`),g=document.getElementById(`toast`),_={key_idea:{emoji:`💡`,name:`Key Idea`},definition:{emoji:`📖`,name:`Definition`},question:{emoji:`❓`,name:`Question`},quote:{emoji:`💬`,name:`Quote`},other:{emoji:`📝`,name:`Other`}};async function v(){a=await e.getAllDocuments(),o={};let t=0;for(let n of a){let r=await e.getNotesForDocument(n.id);o[n.id]=r,t+=r.length}f.textContent=`${a.length} Document${a.length===1?``:`s`} • ${t} Note${t===1?``:`s`}`,s&&!a.some(e=>e.id===s)&&(s=null),!s&&a.length>0&&(s=a[0].id),y(),s?await b():u.innerHTML=`
      <div class="empty-state" style="margin-top: 60px;">
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-title">No documents yet</div>
        <div class="empty-state-text">
          Open any PDF in Chrome, highlight text, and select <strong>"Save to PDF Notes"</strong> to start your library!
        </div>
      </div>
    `}function y(){let e=d.value.toLowerCase().trim(),t=a.filter(t=>t.name.toLowerCase().includes(e));t.length===0?l.innerHTML=`
      <div style="padding: 20px; text-align: center; color: var(--muted); font-size: 12px;">
        No documents match "${w(e)}"
      </div>
    `:(l.innerHTML=t.map(e=>{let t=(o[e.id]||[]).length;return`
      <div class="doc-item ${e.id===s?`active`:``}" data-id="${e.id}">
        <span class="doc-item-icon">📄</span>
        <div class="doc-item-info">
          <div class="doc-item-name">${w(e.name)}</div>
          <div class="doc-item-meta">
            <span>${t} note${t===1?``:`s`}</span>
            <span>${new Date(e.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `}).join(``),document.querySelectorAll(`.doc-item`).forEach(e=>{e.addEventListener(`click`,()=>{s=e.dataset.id,y(),b()})}))}async function b(){if(!s)return;let i=await e.getDocument(s);if(!i)return;c=await e.getNotesForDocument(s);let o=(await e.getAllSources()).filter(e=>e.documentId===s),l=o[0];u.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 8px;">
      <div>
        <h2 style="font-size: 22px; font-weight: 700;">${w(i.name)}</h2>
        <div style="color: var(--muted); font-size: 12px; margin-top: 4px; display: flex; align-items: center; gap: 12px;">
          <span>📝 <strong>${c.length}</strong> saved note${c.length===1?``:`s`}</span>
          <span>📅 Updated ${new Date(i.updatedAt).toLocaleDateString()}</span>
          ${l?`
            <a href="${w(l.displayUrl)}" target="_blank" style="color: var(--primary); text-decoration: none;" title="Open original PDF">
              🔗 Open PDF
            </a>
          `:``}
        </div>
      </div>
      <div style="display: flex; gap: 6px; flex-shrink: 0;">
        <button id="btn-rename" class="btn btn-sm">✏️ Rename</button>
        <button id="btn-merge" class="btn btn-sm">🔀 Merge</button>
        <button id="btn-delete-doc" class="btn btn-sm btn-danger">🗑️ Delete</button>
      </div>
    </div>

    <!-- Export Toolbar -->
    <div class="export-toolbar">
      <span class="export-label">📥 Export Notes:</span>
      <button id="btn-export-docx" class="btn btn-sm" title="Download Word Document">
        📄 Word (.doc)
      </button>
      <button id="btn-export-md" class="btn btn-sm" title="Download Markdown Document (for Notion or Obsidian)">
        📝 Markdown (.md)
      </button>
      <button id="btn-export-pdf" class="btn btn-sm" title="Print or save as PDF">
        🖨️ Print / Save PDF
      </button>
    </div>

    <!-- Notes Search -->
    <div style="margin-bottom: 16px;">
      <input type="text" id="notes-filter-input" placeholder="🔍 Search within these notes...">
    </div>

    <!-- Notes List -->
    <div id="library-notes-list"></div>
  `,x(c);let d=document.getElementById(`notes-filter-input`);d?.addEventListener(`input`,()=>{let e=d.value.toLowerCase().trim();x(c.filter(t=>t.capturedText.toLowerCase().includes(e)||t.comment&&t.comment.toLowerCase().includes(e)||t.tags&&t.tags.some(t=>t.toLowerCase().includes(e))))}),document.getElementById(`btn-rename`)?.addEventListener(`click`,async()=>{let t=prompt(`Enter a new name for this document:`,i.name);t&&t.trim()&&t.trim()!==i.name&&(await e.renameDocument(i.id,t.trim()),C(`Document renamed! ✏️`),await v())}),document.getElementById(`btn-delete-doc`)?.addEventListener(`click`,async()=>{confirm(`Are you sure you want to delete "${i.name}" and all its notes? This cannot be undone.`)&&(await e.deleteDocument(i.id),C(`Document deleted 🗑️`),s=null,await v())}),document.getElementById(`btn-merge`)?.addEventListener(`click`,async()=>{let t=a.filter(e=>e.id!==i.id);if(t.length===0){alert(`No other documents available to merge with.`);return}let n=prompt(`Enter target document name to merge into:\n\nAvailable:\n${t.map(e=>`• ${e.name}`).join(`
`)}`),r=t.find(e=>e.name.toLowerCase()===n?.trim().toLowerCase());r?(await e.mergeDocuments(i.id,r.id),s=r.id,C(`Documents merged! 🔀`),await v()):n&&alert(`Target document not found. Please match the exact document name.`)}),document.getElementById(`btn-export-md`)?.addEventListener(`click`,()=>{let e=t(i,c,o);S(new Blob([e],{type:`text/markdown`}),`${i.name} - Notes.md`),C(`Downloaded Markdown file! 📝`)}),document.getElementById(`btn-export-docx`)?.addEventListener(`click`,()=>{S(n(i,c),`${i.name} - Notes.doc`),C(`Downloaded Word document! 📄`)}),document.getElementById(`btn-export-pdf`)?.addEventListener(`click`,()=>{r(i,c)})}function x(t){let n=document.getElementById(`library-notes-list`);n&&(t.length===0?n.innerHTML=`
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">No notes found</div>
        <div class="empty-state-text">There are no notes captured for this document yet.</div>
      </div>
    `:(n.innerHTML=t.map((e,t)=>{let n=_[e.label]||{emoji:`📝`,name:e.label};return`
      <div class="card" data-id="${e.id}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="badge badge-${e.label}">${n.emoji} ${n.name}</span>
            ${e.pageReference?`<span class="page-ref" style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:11px;">📄 p. ${w(e.pageReference)}</span>`:``}
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-ghost btn-sm btn-copy-card" title="Copy note">📋 Copy</button>
            <button class="btn btn-ghost btn-sm btn-delete-card" style="color: var(--danger);" title="Delete note">🗑️</button>
          </div>
        </div>

        <div class="captured-quote">${w(e.capturedText)}</div>

        ${e.comment?`
          <div style="margin: 6px 0; font-size: 12px; background: #fafafa; border-left: 2px solid #cbd5e1; padding: 6px 8px; border-radius: 0 4px 4px 0;">
            <strong>✏️ Note:</strong> ${w(e.comment)}
          </div>
        `:``}

        ${e.tags&&e.tags.length?`
          <div style="margin-top: 4px;">
            ${e.tags.map(e=>`<span class="tag-chip">#${w(e)}</span>`).join(``)}
          </div>
        `:``}
      </div>
    `}).join(``),n.querySelectorAll(`.card`).forEach(n=>{let r=n.dataset.id,i=t.find(e=>e.id===r);if(!i)return;let a=n.querySelector(`.btn-copy-card`);a?.addEventListener(`click`,()=>{let e=`"${i.capturedText}"`;i.pageReference&&(e+=` (p. ${i.pageReference})`),i.comment&&(e+=`\nNote: ${i.comment}`),navigator.clipboard.writeText(e).then(()=>{a.textContent=`Copied! ✓`,a.style.color=`var(--success)`,C(`Copied to clipboard! 📋`),setTimeout(()=>{a.textContent=`📋 Copy`,a.style.color=``},1800)})}),n.querySelector(`.btn-delete-card`)?.addEventListener(`click`,async()=>{confirm(`Delete this note?`)&&(await e.deleteNote(r),C(`Note deleted`),await v())})})))}d.addEventListener(`input`,y),p.addEventListener(`click`,async()=>{let t=await e.exportJSONBackup(),n=JSON.stringify(t,null,2),r=new Date().toISOString().slice(0,10);S(new Blob([n],{type:`application/json`}),`pdf-notes-backup-${r}.json`),C(`Backup file downloaded! 💾`)}),m.addEventListener(`click`,()=>h.click()),h.addEventListener(`change`,async t=>{let n=t.target.files?.[0];if(!n)return;let r=new FileReader;r.onload=async t=>{try{let n=JSON.parse(t.target?.result),r=confirm(`Would you like to REPLACE your current notes database with this backup?

Click 'OK' to REPLACE, or 'Cancel' to MERGE data safely.`)?`replace`:`merge`;await e.importJSONBackup(n,r),C(`Notes restored successfully! 🎉`),await v()}catch(e){alert(`Could not restore backup file: `+e.message)}},r.readAsText(n)});function S(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,r.click(),URL.revokeObjectURL(n)}function C(e){g.textContent=e,g.classList.add(`show`),setTimeout(()=>{g.classList.remove(`show`)},2200)}function w(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}v();