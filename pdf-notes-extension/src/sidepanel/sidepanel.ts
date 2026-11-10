import { db } from "../db/database";
import { NoteRecord, NoteLabel } from "../db/types";
import { BrowserDetector } from "../utils/browser";

let currentDocId: string | null = null;
let cachedNotes: NoteRecord[] = [];

const docTitleEl = document.getElementById("doc-title") as HTMLHeadingElement;
const notesContainer = document.getElementById("notes-container") as HTMLDivElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const openLibraryBtn = document.getElementById("open-library-btn") as HTMLButtonElement;

openLibraryBtn.addEventListener("click", () => {
  const libraryUrl = chrome.runtime.getURL("src/library/library.html");
  chrome.tabs.create({ url: libraryUrl });
});

searchInput.addEventListener("input", () => {
  renderNotes();
});

async function initializeSidePanel() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  const context = await db.getTabContext(tab.id);
  if (context) {
    currentDocId = context.documentId;
    const doc = await db.getDocument(currentDocId);
    if (doc) docTitleEl.textContent = doc.name;
    await loadNotes();
  }
}

async function loadNotes() {
  if (!currentDocId) return;
  cachedNotes = await db.getNotesForDocument(currentDocId);
  renderNotes();
}

function renderNotes() {
  if (!currentDocId || cachedNotes.length === 0) {
    notesContainer.innerHTML = `
      <div style="color: var(--muted); text-align: center; margin-top: 24px;">
        No notes found for this PDF.
      </div>`;
    return;
  }

  const query = searchInput.value.toLowerCase().trim();
  const filtered = cachedNotes.filter(n =>
    n.capturedText.toLowerCase().includes(query) ||
    n.comment.toLowerCase().includes(query) ||
    n.tags.some(t => t.toLowerCase().includes(query))
  );

  notesContainer.innerHTML = filtered.map(note => `
    <div class="card" data-id="${note.id}">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="badge">${note.label}</span>
        <button class="btn btn-delete" style="padding: 2px 6px; font-size: 10px; color: var(--danger);">Delete</button>
      </div>

      <div class="captured-quote">${escapeHtml(note.capturedText)}</div>

      <label style="font-size: 11px; color: var(--muted);">Page Reference</label>
      <input type="text" class="input-page" value="${escapeHtml(note.pageReference || '')}" placeholder="e.g. 42 or p. 12">

      <label style="font-size: 11px; color: var(--muted);">Label</label>
      <select class="select-label">
        <option value="key_idea" ${note.label === 'key_idea' ? 'selected' : ''}>Key Idea</option>
        <option value="definition" ${note.label === 'definition' ? 'selected' : ''}>Definition</option>
        <option value="question" ${note.label === 'question' ? 'selected' : ''}>Question</option>
        <option value="quote" ${note.label === 'quote' ? 'selected' : ''}>Quote</option>
        <option value="other" ${note.label === 'other' ? 'selected' : ''}>Other</option>
      </select>

      <label style="font-size: 11px; color: var(--muted);">Comment</label>
      <textarea class="input-comment" placeholder="Add your notes or remarks...">${escapeHtml(note.comment || '')}</textarea>

      <label style="font-size: 11px; color: var(--muted);">Tags (comma separated)</label>
      <input type="text" class="input-tags" value="${escapeHtml(note.tags ? note.tags.join(', ') : '')}" placeholder="analysis, key-term">
    </div>
  `).join('');

  attachEventListeners();
}

function attachEventListeners() {
  document.querySelectorAll('.card').forEach(cardEl => {
    const id = (cardEl as HTMLElement).dataset.id!;
    const note = cachedNotes.find(n => n.id === id);
    if (!note) return;

    cardEl.querySelector('.btn-delete')?.addEventListener('click', async () => {
      await db.deleteNote(id);
      await loadNotes();
    });

    cardEl.querySelector('.input-page')?.addEventListener('change', async (e) => {
      note.pageReference = (e.target as HTMLInputElement).value;
      await db.updateNote(note);
    });

    cardEl.querySelector('.select-label')?.addEventListener('change', async (e) => {
      note.label = (e.target as HTMLSelectElement).value as NoteLabel;
      await db.updateNote(note);
    });

    cardEl.querySelector('.input-comment')?.addEventListener('change', async (e) => {
      note.comment = (e.target as HTMLTextAreaElement).value;
      await db.updateNote(note);
    });

    cardEl.querySelector('.input-tags')?.addEventListener('change', async (e) => {
      const raw = (e.target as HTMLInputElement).value;
      note.tags = raw.split(',').map(t => t.trim()).filter(Boolean);
      await db.updateNote(note);
    });
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === "NOTE_CAPTURED") {
    initializeSidePanel();
  }
});

initializeSidePanel();
