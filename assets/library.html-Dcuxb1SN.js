import"./styles-CP8UiGb0.js";import{t as e}from"./database-CceYqlYd.js";function t(e,t,n){let r=[];return r.push(`# ${e.name}`),r.push(`*Exported on ${new Date().toLocaleDateString()} — Total Notes: ${t.length}*\n`),n.length>0&&(r.push(`## Sources`),n.forEach(e=>r.push(`- [${e.displayUrl}](${e.displayUrl}) (${e.sourceType})`)),r.push(``)),r.push(`## Captured Notes
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
  `),n.document.close(),n.focus(),setTimeout(()=>{n.print(),n.close()},250))}function i(e){return e.replace(/[<>&'"]/g,e=>{switch(e){case`<`:return`&lt;`;case`>`:return`&gt;`;case`&`:return`&amp;`;case`'`:return`&apos;`;case`"`:return`&quot;`;default:return e}})}var a=[],o=null,s=document.getElementById(`document-list`),c=document.getElementById(`main-view`),l=document.getElementById(`doc-search`),u=document.getElementById(`btn-export-json`),d=document.getElementById(`btn-import-json`),f=document.getElementById(`file-import`);async function p(){a=await e.getAllDocuments(),m()}function m(){let e=l.value.toLowerCase().trim();s.innerHTML=a.filter(t=>t.name.toLowerCase().includes(e)).map(e=>`
    <div class="doc-item ${e.id===o?`active`:``}" data-id="${e.id}">
      <div style="font-weight: 600;">${_(e.name)}</div>
      <div style="font-size: 11px; color: var(--muted);">${new Date(e.updatedAt).toLocaleDateString()}</div>
    </div>
  `).join(``),document.querySelectorAll(`.doc-item`).forEach(e=>{e.addEventListener(`click`,()=>{o=e.dataset.id,m(),h()})})}async function h(){if(!o)return;let i=await e.getDocument(o);if(!i)return;let s=await e.getNotesForDocument(o),l=(await e.getAllSources()).filter(e=>e.documentId===o);c.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
      <div>
        <h2 style="font-size: 20px;">${_(i.name)}</h2>
        <div style="color: var(--muted); font-size: 12px; margin-top: 4px;">
          ${s.length} saved notes | ${l.length} linked sources
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="btn-rename" class="btn">Rename</button>
        <button id="btn-merge" class="btn">Merge</button>
        <button id="btn-export-md" class="btn">Markdown</button>
        <button id="btn-export-docx" class="btn">DOCX</button>
        <button id="btn-export-pdf" class="btn">PDF</button>
        <button id="btn-delete-doc" class="btn btn-danger">Delete</button>
      </div>
    </div>

    <hr style="border: none; border-top: 1px solid var(--border); margin-bottom: 20px;"/>

    <div id="library-notes-list">
      ${s.map(e=>`
        <div class="card">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge">${e.label}</span>
            ${e.pageReference?`<span style="font-size: 11px; color: var(--muted);">Page ${_(e.pageReference)}</span>`:``}
          </div>
          <div class="captured-quote">${_(e.capturedText)}</div>
          ${e.comment?`<p style="margin: 4px 0;"><strong>Comment:</strong> ${_(e.comment)}</p>`:``}
          ${e.tags&&e.tags.length?`<div>${e.tags.map(e=>`<span class="tag-chip">#${_(e)}</span>`).join(``)}</div>`:``}
        </div>
      `).join(``)}
    </div>
  `,document.getElementById(`btn-rename`)?.addEventListener(`click`,async()=>{let t=prompt(`Enter new document name:`,i.name);t&&t.trim()&&(await e.renameDocument(i.id,t.trim()),await p(),h())}),document.getElementById(`btn-delete-doc`)?.addEventListener(`click`,async()=>{confirm(`Are you sure you want to delete "${i.name}" and all its notes?`)&&(await e.deleteDocument(i.id),o=null,await p(),c.innerHTML=`<div style="color: var(--muted); margin-top: 50px; text-align: center;">Select a document.</div>`)}),document.getElementById(`btn-merge`)?.addEventListener(`click`,async()=>{let t=a.filter(e=>e.id!==i.id);if(t.length===0){alert(`No other documents available to merge with.`);return}let n=prompt(`Enter target document name to merge into:\nAvailable:\n${t.map(e=>`- ${e.name}`).join(`
`)}`),r=t.find(e=>e.name.toLowerCase()===n?.trim().toLowerCase());r?(await e.mergeDocuments(i.id,r.id),o=r.id,await p(),h()):n&&alert(`Target document not found.`)}),document.getElementById(`btn-export-md`)?.addEventListener(`click`,()=>{let e=t(i,s,l);g(new Blob([e],{type:`text/markdown`}),`${i.name}.md`)}),document.getElementById(`btn-export-docx`)?.addEventListener(`click`,()=>{g(n(i,s),`${i.name}.doc`)}),document.getElementById(`btn-export-pdf`)?.addEventListener(`click`,()=>{r(i,s)})}l.addEventListener(`input`,m),u.addEventListener(`click`,async()=>{let t=await e.exportJSONBackup(),n=JSON.stringify(t,null,2);g(new Blob([n],{type:`application/json`}),`pdf-notes-backup-${new Date().toISOString().slice(0,10)}.json`)}),d.addEventListener(`click`,()=>f.click()),f.addEventListener(`change`,async t=>{let n=t.target.files?.[0];if(!n)return;let r=new FileReader;r.onload=async t=>{try{let n=JSON.parse(t.target?.result),r=confirm(`Click OK to REPLACE your database, or Cancel to MERGE data.`)?`replace`:`merge`;await e.importJSONBackup(n,r),alert(`Import successful!`),await p()}catch(e){alert(`Import failed: `+e.message)}},r.readAsText(n)});function g(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,r.click(),URL.revokeObjectURL(n)}function _(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}p();