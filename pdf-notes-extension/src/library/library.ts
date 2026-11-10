import { db } from "../db/database";
import { PDFDocumentRecord, SourceRecord } from "../db/types";
import { exportToMarkdown, exportToDocxHtml, printPdfDocument } from "../utils/exporters";

let documents: PDFDocumentRecord[] = [];
let selectedDocId: string | null = null;

const docListEl = document.getElementById("document-list") as HTMLDivElement;
const mainViewEl = document.getElementById("main-view") as HTMLDivElement;
const docSearchInput = document.getElementById("doc-search") as HTMLInputElement;
const btnExportJson = document.getElementById("btn-export-json") as HTMLButtonElement;
const btnImportJson = document.getElementById("btn-import-json") as HTMLButtonElement;
const fileImport = document.getElementById("file-import") as HTMLInputElement;

async function loadLibrary() {
  documents = await db.getAllDocuments();
  renderSidebar();
}

function renderSidebar() {
  const query = docSearchInput.value.toLowerCase().trim();
  const filtered = documents.filter(d => d.name.toLowerCase().includes(query));

  docListEl.innerHTML = filtered.map(doc => `
    <div class="doc-item ${doc.id === selectedDocId ? 'active' : ''}" data-id="${doc.id}">
      <div style="font-weight: 600;">${escapeHtml(doc.name)}</div>
      <div style="font-size: 11px; color: var(--muted);">${new Date(doc.updatedAt).toLocaleDateString()}</div>
    </div>
  `).join('');

  document.querySelectorAll('.doc-item').forEach(el => {
    el.addEventListener('click', () => {
      selectedDocId = (el as HTMLElement).dataset.id!;
      renderSidebar();
      renderDocumentDetails();
    });
  });
}

async function renderDocumentDetails() {
  if (!selectedDocId) return;

  const doc = await db.getDocument(selectedDocId);
  if (!doc) return;

  const notes = await db.getNotesForDocument(selectedDocId);
  const sources = await db.getAllSources();
  const docSources = sources.filter(s => s.documentId === selectedDocId);

  mainViewEl.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
      <div>
        <h2 style="font-size: 20px;">${escapeHtml(doc.name)}</h2>
        <div style="color: var(--muted); font-size: 12px; margin-top: 4px;">
          ${notes.length} saved notes | ${docSources.length} linked sources
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
      ${notes.map(n => `
        <div class="card">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge">${n.label}</span>
            ${n.pageReference ? `<span style="font-size: 11px; color: var(--muted);">Page ${escapeHtml(n.pageReference)}</span>` : ''}
          </div>
          <div class="captured-quote">${escapeHtml(n.capturedText)}</div>
          ${n.comment ? `<p style="margin: 4px 0;"><strong>Comment:</strong> ${escapeHtml(n.comment)}</p>` : ''}
          ${n.tags && n.tags.length ? `<div>${n.tags.map(t => `<span class="tag-chip">#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById("btn-rename")?.addEventListener("click", async () => {
    const newName = prompt("Enter new document name:", doc.name);
    if (newName && newName.trim()) {
      await db.renameDocument(doc.id, newName.trim());
      await loadLibrary();
      renderDocumentDetails();
    }
  });

  document.getElementById("btn-delete-doc")?.addEventListener("click", async () => {
    if (confirm(`Are you sure you want to delete "${doc.name}" and all its notes?`)) {
      await db.deleteDocument(doc.id);
      selectedDocId = null;
      await loadLibrary();
      mainViewEl.innerHTML = `<div style="color: var(--muted); margin-top: 50px; text-align: center;">Select a document.</div>`;
    }
  });

  document.getElementById("btn-merge")?.addEventListener("click", async () => {
    const otherDocs = documents.filter(d => d.id !== doc.id);
    if (otherDocs.length === 0) {
      alert("No other documents available to merge with.");
      return;
    }
    const targetName = prompt(`Enter target document name to merge into:\nAvailable:\n${otherDocs.map(d => `- ${d.name}`).join('\n')}`);
    const targetDoc = otherDocs.find(d => d.name.toLowerCase() === targetName?.trim().toLowerCase());
    if (targetDoc) {
      await db.mergeDocuments(doc.id, targetDoc.id);
      selectedDocId = targetDoc.id;
      await loadLibrary();
      renderDocumentDetails();
    } else if (targetName) {
      alert("Target document not found.");
    }
  });

  document.getElementById("btn-export-md")?.addEventListener("click", () => {
    const md = exportToMarkdown(doc, notes, docSources);
    downloadBlob(new Blob([md], { type: "text/markdown" }), `${doc.name}.md`);
  });

  document.getElementById("btn-export-docx")?.addEventListener("click", () => {
    const blob = exportToDocxHtml(doc, notes);
    downloadBlob(blob, `${doc.name}.doc`);
  });

  document.getElementById("btn-export-pdf")?.addEventListener("click", () => {
    printPdfDocument(doc, notes);
  });
}

docSearchInput.addEventListener("input", renderSidebar);

btnExportJson.addEventListener("click", async () => {
  const backupData = await db.exportJSONBackup();
  const jsonStr = JSON.stringify(backupData, null, 2);
  downloadBlob(new Blob([jsonStr], { type: "application/json" }), `pdf-notes-backup-${new Date().toISOString().slice(0, 10)}.json`);
});

btnImportJson.addEventListener("click", () => fileImport.click());

fileImport.addEventListener("change", async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target?.result as string);
      const mode = confirm("Click OK to REPLACE your database, or Cancel to MERGE data.") ? "replace" : "merge";
      await db.importJSONBackup(data, mode);
      alert("Import successful!");
      await loadLibrary();
    } catch (err: any) {
      alert("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
});

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

loadLibrary();
