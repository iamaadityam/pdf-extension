// setup.js - Run with: node setup.js
const fs = require('fs');
const path = require('path');

const rootDir = path.join(process.cwd(), 'pdf-notes-extension');

const files = {
  // --- Root Config Files ---
  'package.json': JSON.stringify({
    "name": "pdf-notes-extension",
    "version": "1.0.0",
    "description": "Capture, organize, and export passages from PDFs natively in Chrome & Brave.",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "build:chrome": "tsc && vite build --config vite.config.chrome.ts",
      "build:brave": "tsc && vite build --config vite.config.brave.ts"
    },
    "devDependencies": {
      "@crxjs/vite-plugin": "^2.0.0-beta.23",
      "@types/chrome": "^0.0.270",
      "typescript": "^5.2.2",
      "vite": "^5.0.0"
    }
  }, null, 2),

  'tsconfig.json': JSON.stringify({
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "noImplicitAny": true,
      "lib": ["ES2022", "DOM", "DOM.Iterable", "ScriptHost"],
      "types": ["chrome", "node"],
      "typeRoots": ["./node_modules/@types", "./src/types"]
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }, null, 2),

  'vite.config.ts': `import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    emptyOutDir: true,
    outDir: 'dist'
  }
});`,

  'vite.config.chrome.ts': `import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    emptyOutDir: true,
    outDir: 'dist/chrome'
  }
});`,

  'vite.config.brave.ts': `import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    emptyOutDir: true,
    outDir: 'dist/brave'
  }
});`,

  'manifest.json': JSON.stringify({
    "manifest_version": 3,
    "name": "PDF Notes",
    "version": "1.0.0",
    "description": "Capture, organize, and export passages from PDFs natively in Chrome & Brave.",
    "permissions": [
      "contextMenus",
      "activeTab",
      "sidePanel",
      "storage"
    ],
    "background": {
      "service_worker": "src/background.ts",
      "type": "module"
    },
    "action": {
      "default_title": "Open PDF Notes Library",
      "default_popup": "src/popup.html"
    },
    "side_panel": {
      "default_path": "src/sidepanel/sidepanel.html"
    },
    "minimum_chrome_version": "116",
    "minimum_brave_version": "1.46.0"
  }, null, 2),

  // --- Source Files ---
  'src/types/extension.d.ts': `/// <reference types="chrome" />

// Brave browser API declarations (extends Chrome APIs)
declare namespace chrome {
  // Brave-specific APIs (if any) would go here
  // Most Brave APIs are identical to Chrome's
}

// Firefox compatibility (if needed in future)
declare const browser: typeof chrome | undefined;
`,

  'src/utils/browser.ts': `export const BrowserDetector = {
  isChrome(): boolean {
    return navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
  },
  
  isBrave(): boolean {
    return navigator.userAgent.includes('Brave') || 
           (navigator.userAgent.includes('Chrome') && 
            'brave' in navigator);
  },
  
  isFirefox(): boolean {
    return navigator.userAgent.includes('Firefox');
  },
  
  getCurrentBrowser(): 'chrome' | 'brave' | 'firefox' | 'unknown' {
    if (this.isBrave()) return 'brave';
    if (this.isChrome()) return 'chrome';
    if (this.isFirefox()) return 'firefox';
    return 'unknown';
  }
};`,

  'src/db/types.ts': `export type NoteLabel = "key_idea" | "definition" | "question" | "quote" | "other";

export interface PDFDocumentRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface SourceRecord {
  id: string;
  documentId: string;
  sourceKey: string;
  displayUrl: string;
  reopenUrl?: string;
  sourceType: "web" | "local" | "embedded";
  firstSeenAt: number;
  lastSeenAt: number;
}

export interface NoteRecord {
  id: string;
  documentId: string;
  sourceId: string;
  capturedText: string;
  pageReference?: string;
  label: NoteLabel;
  comment: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TabContextRecord {
  tabId: number;
  documentId: string;
  sourceId: string;
  updatedAt: number;
}

export interface SettingRecord {
  key: string;
  value: any;
}

export interface ExportBackupData {
  version: number;
  exportedAt: string;
  documents: PDFDocumentRecord[];
  sources: SourceRecord[];
  notes: NoteRecord[];
  settings: SettingRecord[];
}
`,

  'src/db/database.ts': `import { PDFDocumentRecord, SourceRecord, NoteRecord, TabContextRecord, SettingRecord, ExportBackupData } from "./types";

const DB_NAME = "PDFNotesDB";
const DB_VERSION = 1;

export class Database {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.init();
  }

  private init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("documents")) {
          const docStore = db.createObjectStore("documents", { keyPath: "id" });
          docStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("sources")) {
          const sourceStore = db.createObjectStore("sources", { keyPath: "id" });
          sourceStore.createIndex("sourceKey", "sourceKey", { unique: false });
          sourceStore.createIndex("documentId", "documentId", { unique: false });
        }
        if (!db.objectStoreNames.contains("notes")) {
          const noteStore = db.createObjectStore("notes", { keyPath: "id" });
          noteStore.createIndex("documentId", "documentId", { unique: false });
          noteStore.createIndex("sourceId", "sourceId", { unique: false });
          noteStore.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("tabContexts")) {
          db.createObjectStore("tabContexts", { keyPath: "tabId" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async createDocument(name: string): Promise<PDFDocumentRecord> {
    const store = await this.getStore("documents", "readwrite");
    const doc: PDFDocumentRecord = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return new Promise((resolve, reject) => {
      const req = store.add(doc);
      req.onsuccess = () => resolve(doc);
      req.onerror = () => reject(req.error);
    });
  }

  async getDocument(id: string): Promise<PDFDocumentRecord | undefined> {
    const store = await this.getStore("documents");
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllDocuments(): Promise<PDFDocumentRecord[]> {
    const store = await this.getStore("documents");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async renameDocument(id: string, newName: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction("documents", "readwrite");
    const store = tx.objectStore("documents");
    const doc: PDFDocumentRecord = await new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (doc) {
      doc.name = newName;
      doc.updatedAt = Date.now();
      await new Promise((resolve, reject) => {
        const req = store.put(doc);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }

  async deleteDocument(id: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(["documents", "sources", "notes"], "readwrite");
    
    tx.objectStore("documents").delete(id);

    const sourceStore = tx.objectStore("sources");
    const sourceIdx = sourceStore.index("documentId");
    const sourceReq = sourceIdx.getAllKeys(id);
    sourceReq.onsuccess = () => {
      (sourceReq.result || []).forEach(key => sourceStore.delete(key));
    };

    const noteStore = tx.objectStore("notes");
    const noteIdx = noteStore.index("documentId");
    const noteReq = noteIdx.getAllKeys(id);
    noteReq.onsuccess = () => {
      (noteReq.result || []).forEach(key => noteStore.delete(key));
    };

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async mergeDocuments(sourceDocId: string, targetDocId: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(["documents", "sources", "notes"], "readwrite");
    const now = Date.now();

    const sourceStore = tx.objectStore("sources");
    const sourceIdx = sourceStore.index("documentId");
    const sources: SourceRecord[] = await new Promise(r => {
      sourceIdx.getAll(sourceDocId).onsuccess = (e: any) => r(e.target.result || []);
    });
    for (const src of sources) {
      src.documentId = targetDocId;
      sourceStore.put(src);
    }

    const noteStore = tx.objectStore("notes");
    const noteIdx = noteStore.index("documentId");
    const notes: NoteRecord[] = await new Promise(r => {
      noteIdx.getAll(sourceDocId).onsuccess = (e: any) => r(e.target.result || []);
    });
    for (const note of notes) {
      note.documentId = targetDocId;
      note.updatedAt = now;
      noteStore.put(note);
    }

    const docStore = tx.objectStore("documents");
    const targetDoc: PDFDocumentRecord = await new Promise(r => {
      docStore.get(targetDocId).onsuccess = (e: any) => r(e.target.result);
    });
    if (targetDoc) {
      targetDoc.updatedAt = now;
      docStore.put(targetDoc);
    }
    docStore.delete(sourceDocId);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async findOrCreateSource(sourceKey: string, displayUrl: string, sourceType: "web" | "local" | "embedded", docName: string): Promise<{ document: PDFDocumentRecord; source: SourceRecord }> {
    const db = await this.dbPromise;
    const tx = db.transaction(["documents", "sources"], "readwrite");
    const sourceStore = tx.objectStore("sources");
    const docStore = tx.objectStore("documents");

    const sourceIdx = sourceStore.index("sourceKey");
    const existingSources: SourceRecord[] = await new Promise(r => {
      sourceIdx.getAll(sourceKey).onsuccess = (e: any) => r(e.target.result || []);
    });

    const now = Date.now();

    if (existingSources.length > 0) {
      const src = existingSources[0];
      src.lastSeenAt = now;
      sourceStore.put(src);
      const doc: PDFDocumentRecord = await new Promise(r => {
        docStore.get(src.documentId).onsuccess = (e: any) => r(e.target.result);
      });
      await new Promise(r => { tx.oncomplete = r; });
      return { document: doc, source: src };
    }

    const newDoc: PDFDocumentRecord = {
      id: crypto.randomUUID(),
      name: docName,
      createdAt: now,
      updatedAt: now
    };
    docStore.add(newDoc);

    const newSource: SourceRecord = {
      id: crypto.randomUUID(),
      documentId: newDoc.id,
      sourceKey,
      displayUrl,
      sourceType,
      firstSeenAt: now,
      lastSeenAt: now
    };
    sourceStore.add(newSource);

    await new Promise(r => { tx.oncomplete = r; });
    return { document: newDoc, source: newSource };
  }

  async addNote(note: Omit<NoteRecord, "id" | "createdAt" | "updatedAt">): Promise<NoteRecord> {
    const store = await this.getStore("notes", "readwrite");
    const fullNote: NoteRecord = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return new Promise((resolve, reject) => {
      const req = store.add(fullNote);
      req.onsuccess = () => resolve(fullNote);
      req.onerror = () => reject(req.error);
    });
  }

  async getNotesForDocument(documentId: string): Promise<NoteRecord[]> {
    const store = await this.getStore("notes");
    const idx = store.index("documentId");
    return new Promise((resolve, reject) => {
      const req = idx.getAll(documentId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async updateNote(note: NoteRecord): Promise<void> {
    const store = await this.getStore("notes", "readwrite");
    note.updatedAt = Date.now();
    return new Promise((resolve, reject) => {
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    const store = await this.getStore("notes", "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async setTabContext(tabId: number, documentId: string, sourceId: string): Promise<void> {
    const store = await this.getStore("tabContexts", "readwrite");
    const record: TabContextRecord = { tabId, documentId, sourceId, updatedAt: Date.now() };
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getTabContext(tabId: number): Promise<TabContextRecord | undefined> {
    const store = await this.getStore("tabContexts");
    return new Promise((resolve, reject) => {
      const req = store.get(tabId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async clearTabContext(tabId: number): Promise<void> {
    const store = await this.getStore("tabContexts", "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.delete(tabId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async exportJSONBackup(): Promise<ExportBackupData> {
    const docs = await this.getAllDocuments();
    const sources = await (await this.getStore("sources")).getAll();
    const notes = await (await this.getStore("notes")).getAll();
    const settings = await (await this.getStore("settings")).getAll();

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      documents: docs,
      sources: sources.result || [],
      notes: notes.result || [],
      settings: settings.result || []
    };
  }

  async importJSONBackup(data: ExportBackupData, mode: "merge" | "replace"): Promise<void> {
    if (!data || data.version !== 1 || !Array.isArray(data.documents) || !Array.isArray(data.notes)) {
      throw new Error("Invalid backup JSON format or incompatible version.");
    }

    const db = await this.dbPromise;
    const tx = db.transaction(["documents", "sources", "notes", "settings"], "readwrite");

    if (mode === "replace") {
      tx.objectStore("documents").clear();
      tx.objectStore("sources").clear();
      tx.objectStore("notes").clear();
      tx.objectStore("settings").clear();
    }

    const docStore = tx.objectStore("documents");
    const sourceStore = tx.objectStore("sources");
    const noteStore = tx.objectStore("notes");
    const settingStore = tx.objectStore("settings");

    data.documents.forEach(doc => docStore.put(doc));
    data.sources.forEach(src => sourceStore.put(src));
    data.notes.forEach(note => noteStore.put(note));
    data.settings.forEach(set => settingStore.put(set));

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const db = new Database();
`,

  'src/utils/url.ts': `export interface NormalizedURLResult {
  sourceKey: string;
  displayUrl: string;
  sourceType: "web" | "local" | "embedded";
  derivedTitle: string;
}

export function normalizePdfUrl(rawUrl: string | undefined, tabTitle?: string): NormalizedURLResult {
  if (!rawUrl) {
    return {
      sourceKey: "unknown-source",
      displayUrl: "Unknown Source",
      sourceType: "web",
      derivedTitle: tabTitle || "Untitled PDF Document"
    };
  }

  let sourceType: "web" | "local" | "embedded" = "web";
  if (rawUrl.startsWith("file://")) {
    sourceType = "local";
  } else if (rawUrl.startsWith("chrome-extension://")) {
    sourceType = "embedded";
  }

  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";

    const displayUrl = parsed.toString();
    const sourceKey = displayUrl.toLowerCase();

    let derivedTitle = tabTitle || "";
    if (!derivedTitle || derivedTitle.endsWith(".pdf") || derivedTitle === rawUrl) {
      const pathname = parsed.pathname;
      const fileName = pathname.substring(pathname.lastIndexOf("/") + 1);
      derivedTitle = fileName ? decodeURIComponent(fileName) : "Untitled PDF Document";
    }

    if (derivedTitle.toLowerCase().endsWith(".pdf")) {
      derivedTitle = derivedTitle.substring(0, derivedTitle.length - 4);
    }

    return {
      sourceKey,
      displayUrl,
      sourceType,
      derivedTitle: derivedTitle || "Untitled PDF Document"
    };
  } catch {
    return {
      sourceKey: rawUrl.toLowerCase(),
      displayUrl: rawUrl,
      sourceType,
      derivedTitle: tabTitle || "Untitled PDF Document"
    };
  }
}
`,

  'src/utils/exporters.ts': `import { PDFDocumentRecord, NoteRecord, SourceRecord } from "../db/types";

export function exportToMarkdown(doc: PDFDocumentRecord, notes: NoteRecord[], sources: SourceRecord[]): string {
  const lines: string[] = [];

  lines.push(\`# \${doc.name}\`);
  lines.push(\`*Exported on \${new Date().toLocaleDateString()} — Total Notes: \${notes.length}*\\n\`);

  if (sources.length > 0) {
    lines.push(\`## Sources\`);
    sources.forEach(s => lines.push(\`- [\${s.displayUrl}](\${s.displayUrl}) (\${s.sourceType})\`));
    lines.push("");
  }

  lines.push(\`## Captured Notes\\n\`);

  notes.forEach((n, i) => {
    lines.push(\`### Note \${i + 1} [\${n.label.toUpperCase()}]\`);
    if (n.pageReference) {
      lines.push(\`**Page:** \${n.pageReference}\`);
    }
    lines.push(\`> \${n.capturedText.replace(/\\n/g, "\\n> ")}\\n\`);
    if (n.comment) {
      lines.push(\`**Comment:** \${n.comment}\\n\`);
    }
    if (n.tags && n.tags.length > 0) {
      lines.push(\`**Tags:** \${n.tags.map(t => \`#\${t}\`).join(" ")}\\n\`);
    }
    lines.push("---\\n");
  });

  return lines.join("\\n");
}

export function exportToDocxHtml(doc: PDFDocumentRecord, notes: NoteRecord[]): Blob {
  const htmlContent = \`
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>\${escapeXml(doc.name)}</title>
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
      <h1>\${escapeXml(doc.name)}</h1>
      <p class="meta">Exported on \${new Date().toLocaleDateString()} | \${notes.length} Notes</p>
      <hr/>
      \${notes.map((n, i) => \`
        <div>
          <h2>Note \${i + 1} <span class="label">(\${n.label})</span></h2>
          \${n.pageReference ? \`<p class="meta">Page Reference: \${escapeXml(n.pageReference)}</p>\` : ''}
          <blockquote>\${escapeXml(n.capturedText).replace(/\\n/g, '<br/>')}</blockquote>
          \${n.comment ? \`<p><strong>Comment:</strong> \${escapeXml(n.comment)}</p>\` : ''}
          \${n.tags.length ? \`<p class="meta">Tags: \${escapeXml(n.tags.join(', '))}</p>\` : ''}
        </div>
      \`).join('<br/>')}
    </body>
    </html>
  \`;

  return new Blob(['\\ufeff' + htmlContent], { type: 'application/msword' });
}

export function printPdfDocument(doc: PDFDocumentRecord, notes: NoteRecord[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>\${escapeXml(doc.name)} - Notes</title>
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
      <h1>\${escapeXml(doc.name)}</h1>
      <p class="meta">Exported on \${new Date().toLocaleDateString()} | Total Notes: \${notes.length}</p>
      \${notes.map(n => \`
        <div class="note">
          <div><span class="badge">\${n.label.toUpperCase()}</span> \${n.pageReference ? \`<span class="meta">| Page \${escapeXml(n.pageReference)}</span>\` : ''}</div>
          <div class="quote">\${escapeXml(n.capturedText)}</div>
          \${n.comment ? \`<p><strong>Comment:</strong> \${escapeXml(n.comment)}</p>\` : ''}
          \${n.tags.length ? \`<p class="meta">Tags: \${escapeXml(n.tags.join(', '))}</p>\` : ''}
        </div>
      \`).join('')}
    </body>
    </html>
  \`);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
`,

  'src/background.ts': `import { db } from "./db/database";
import { normalizePdfUrl } from "./utils/url";
import { BrowserDetector } from "./utils/browser";

const CONTEXT_MENU_ID = "pdf-notes-capture";
const MAX_SELECTION_LENGTH = 100000;

chrome.runtime.onInstalled.addListener(() => {
  const browser = BrowserDetector.getCurrentBrowser();
  console.log(\`PDF Notes installed on \${browser}\`);
  
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Save selection to PDF Notes",
    contexts: ["selection"]
  });
});

chrome.action.onClicked.addListener(() => {
  const libraryUrl = chrome.runtime.getURL("src/library/library.html");
  chrome.tabs.create({ url: libraryUrl });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab || !tab.id) return;

  const rawSelection = info.selectionText ? info.selectionText.trim() : "";
  if (!rawSelection) return;

  if (rawSelection.length > MAX_SELECTION_LENGTH) {
    console.warn("Selection exceeds limit");
  }

  const targetUrl = info.pageUrl || info.frameUrl || tab.url;
  const normalized = normalizePdfUrl(targetUrl, tab.title);

  try {
    const { document: doc, source } = await db.findOrCreateSource(
      normalized.sourceKey,
      normalized.displayUrl,
      normalized.sourceType,
      normalized.derivedTitle
    );

    const note = await db.addNote({
      documentId: doc.id,
      sourceId: source.id,
      capturedText: rawSelection,
      label: "key_idea",
      comment: "",
      tags: []
    });

    await db.setTabContext(tab.id, doc.id, source.id);

    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn("Could not auto-open side panel:", err);
    }

    chrome.runtime.sendMessage({
      type: "NOTE_CAPTURED",
      documentId: doc.id,
      noteId: note.id
    }).catch(() => {});

  } catch (error) {
    console.error("Failed to capture PDF note:", error);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await db.clearTabContext(tabId);
});
`,

  'src/styles.css': `:root {
  --primary: #0284c7;
  --primary-hover: #0369a1;
  --bg: #f8fafc;
  --surface: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --danger: #ef4444;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
}

header {
  background-color: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1, h2, h3 { margin: 0; color: var(--text); }
h1 { font-size: 16px; font-weight: 600; }
h2 { font-size: 14px; font-weight: 600; }

.btn {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.btn:hover { background: #f1f5f9; }
.btn-primary { background: var(--primary); color: white; border: none; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-danger { background: var(--danger); color: white; border: none; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.captured-quote {
  background: #f1f5f9;
  border-left: 3px solid var(--primary);
  padding: 8px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 8px 0;
  border-radius: 0 4px 4px 0;
}

input, select, textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 8px;
}
textarea { resize: vertical; min-height: 50px; }

.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: #e0f2fe;
  color: #0369a1;
}

.tag-chip {
  display: inline-block;
  background: #f1f5f9;
  color: var(--muted);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 11px;
  margin-right: 4px;
}
`,

  'src/sidepanel/sidepanel.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PDF Notes Side Panel</title>
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <header>
    <h1 id="doc-title">Current PDF Notes</h1>
    <button id="open-library-btn" class="btn">Library ↗</button>
  </header>

  <main style="padding: 12px;">
    <div id="search-bar" style="margin-bottom: 12px;">
      <input type="text" id="search-input" placeholder="Search notes in this document...">
    </div>

    <div id="notes-container">
      <div style="color: var(--muted); text-align: center; margin-top: 24px;">
        No notes captured for this tab yet. Highlight text on a PDF and right-click to save.
      </div>
    </div>
  </main>

  <script type="module" src="sidepanel.ts"></script>
</body>
</html>
`,

  'src/sidepanel/sidepanel.ts': `import { db } from "../db/database";
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
    notesContainer.innerHTML = \`
      <div style="color: var(--muted); text-align: center; margin-top: 24px;">
        No notes found for this PDF.
      </div>\`;
    return;
  }

  const query = searchInput.value.toLowerCase().trim();
  const filtered = cachedNotes.filter(n =>
    n.capturedText.toLowerCase().includes(query) ||
    n.comment.toLowerCase().includes(query) ||
    n.tags.some(t => t.toLowerCase().includes(query))
  );

  notesContainer.innerHTML = filtered.map(note => \`
    <div class="card" data-id="\${note.id}">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="badge">\${note.label}</span>
        <button class="btn btn-delete" style="padding: 2px 6px; font-size: 10px; color: var(--danger);">Delete</button>
      </div>

      <div class="captured-quote">\${escapeHtml(note.capturedText)}</div>

      <label style="font-size: 11px; color: var(--muted);">Page Reference</label>
      <input type="text" class="input-page" value="\${escapeHtml(note.pageReference || '')}" placeholder="e.g. 42 or p. 12">

      <label style="font-size: 11px; color: var(--muted);">Label</label>
      <select class="select-label">
        <option value="key_idea" \${note.label === 'key_idea' ? 'selected' : ''}>Key Idea</option>
        <option value="definition" \${note.label === 'definition' ? 'selected' : ''}>Definition</option>
        <option value="question" \${note.label === 'question' ? 'selected' : ''}>Question</option>
        <option value="quote" \${note.label === 'quote' ? 'selected' : ''}>Quote</option>
        <option value="other" \${note.label === 'other' ? 'selected' : ''}>Other</option>
      </select>

      <label style="font-size: 11px; color: var(--muted);">Comment</label>
      <textarea class="input-comment" placeholder="Add your notes or remarks...">\${escapeHtml(note.comment || '')}</textarea>

      <label style="font-size: 11px; color: var(--muted);">Tags (comma separated)</label>
      <input type="text" class="input-tags" value="\${escapeHtml(note.tags ? note.tags.join(', ') : '')}" placeholder="analysis, key-term">
    </div>
  \`).join('');

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
`,

  'src/library/library.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PDF Notes - Central Library</title>
  <link rel="stylesheet" href="../styles.css">
  <style>
    .layout { display: flex; height: calc(100vh - 49px); }
    .sidebar { width: 320px; border-right: 1px solid var(--border); background: var(--surface); overflow-y: auto; }
    .content { flex: 1; padding: 20px; overflow-y: auto; }
    .doc-item { padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; }
    .doc-item:hover, .doc-item.active { background: #f0f9ff; }
  </style>
</head>
<body>
  <header>
    <h1>PDF Notes Library</h1>
    <div>
      <button id="btn-export-json" class="btn">Backup JSON</button>
      <button id="btn-import-json" class="btn">Restore JSON</button>
      <input type="file" id="file-import" accept=".json" style="display: none;">
    </div>
  </header>

  <div class="layout">
    <div class="sidebar">
      <div style="padding: 12px; border-bottom: 1px solid var(--border);">
        <input type="text" id="doc-search" placeholder="Filter documents...">
      </div>
      <div id="document-list"></div>
    </div>

    <div class="content">
      <div id="main-view">
        <div style="color: var(--muted); margin-top: 50px; text-align: center;">
          Select a document from the left sidebar to inspect notes and exports.
        </div>
      </div>
    </div>
  </div>

  <script type="module" src="library.ts"></script>
</body>
</html>
`,

  'src/library/library.ts': `import { db } from "../db/database";
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

  docListEl.innerHTML = filtered.map(doc => \`
    <div class="doc-item \${doc.id === selectedDocId ? 'active' : ''}" data-id="\${doc.id}">
      <div style="font-weight: 600;">\${escapeHtml(doc.name)}</div>
      <div style="font-size: 11px; color: var(--muted);">\${new Date(doc.updatedAt).toLocaleDateString()}</div>
    </div>
  \`).join('');

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
  const sources = (await (await db['getStore']('sources')).getAll()).result as SourceRecord[];
  const docSources = sources.filter(s => s.documentId === selectedDocId);

  mainViewEl.innerHTML = \`
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
      <div>
        <h2 style="font-size: 20px;">\${escapeHtml(doc.name)}</h2>
        <div style="color: var(--muted); font-size: 12px; margin-top: 4px;">
          \${notes.length} saved notes | \${docSources.length} linked sources
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
      \${notes.map(n => \`
        <div class="card">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge">\${n.label}</span>
            \${n.pageReference ? \`<span style="font-size: 11px; color: var(--muted);">Page \${escapeHtml(n.pageReference)}</span>\` : ''}
          </div>
          <div class="captured-quote">\${escapeHtml(n.capturedText)}</div>
          \${n.comment ? \`<p style="margin: 4px 0;"><strong>Comment:</strong> \${escapeHtml(n.comment)}</p>\` : ''}
          \${n.tags && n.tags.length ? \`<div>\${n.tags.map(t => \`<span class="tag-chip">#\${escapeHtml(t)}</span>\`).join('')}</div>\` : ''}
        </div>
      \`).join('')}
    </div>
  \`;

  document.getElementById("btn-rename")?.addEventListener("click", async () => {
    const newName = prompt("Enter new document name:", doc.name);
    if (newName && newName.trim()) {
      await db.renameDocument(doc.id, newName.trim());
      await loadLibrary();
      renderDocumentDetails();
    }
  });

  document.getElementById("btn-delete-doc")?.addEventListener("click", async () => {
    if (confirm(\`Are you sure you want to delete "\${doc.name}" and all its notes?\`)) {
      await db.deleteDocument(doc.id);
      selectedDocId = null;
      await loadLibrary();
      mainViewEl.innerHTML = \`<div style="color: var(--muted); margin-top: 50px; text-align: center;">Select a document.</div>\`;
    }
  });

  document.getElementById("btn-merge")?.addEventListener("click", async () => {
    const otherDocs = documents.filter(d => d.id !== doc.id);
    if (otherDocs.length === 0) {
      alert("No other documents available to merge with.");
      return;
    }
    const targetName = prompt(\`Enter target document name to merge into:\\nAvailable:\\n\${otherDocs.map(d => \`- \${d.name}\`).join('\\n')}\`);
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
    downloadBlob(new Blob([md], { type: "text/markdown" }), \`\${doc.name}.md\`);
  });

  document.getElementById("btn-export-docx")?.addEventListener("click", () => {
    const blob = exportToDocxHtml(doc, notes);
    downloadBlob(blob, \`\${doc.name}.doc\`);
  });

  document.getElementById("btn-export-pdf")?.addEventListener("click", () => {
    printPdfDocument(doc, notes);
  });
}

docSearchInput.addEventListener("input", renderSidebar);

btnExportJson.addEventListener("click", async () => {
  const backupData = await db.exportJSONBackup();
  const jsonStr = JSON.stringify(backupData, null, 2);
  downloadBlob(new Blob([jsonStr], { type: "application/json" }), \`pdf-notes-backup-\${new Date().toISOString().slice(0, 10)}.json\`);
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
`,

  'src/popup.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PDF Notes</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    body { width: 300px; padding: 16px; }
    .popup-container { text-align: center; }
    h1 { font-size: 18px; margin-bottom: 16px; }
    .btn { width: 100%; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="popup-container">
    <h1>PDF Notes</h1>
    <p>Capture, organize, and export passages from PDFs.</p>
    <button id="open-library" class="btn btn-primary">Open Library</button>
    <button id="open-sidepanel" class="btn">Open Side Panel</button>
  </div>
  <script type="module" src="popup.ts"></script>
</body>
</html>
`,

  'src/popup.ts': `document.getElementById('open-library')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/library/library.html') });
});

document.getElementById('open-sidepanel')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.error('Could not open side panel:', err);
    }
  }
});
`
};

console.log("Generating folder: pdf-notes-extension...");

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(rootDir, filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(` Created: ${filePath}`);
});

console.log("\nSuccess! Project structure successfully written to folder: ./pdf-notes-extension");
console.log("\nNext steps:");
console.log("1. cd pdf-notes-extension");
console.log("2. npm install");
console.log("3. npm run build");
console.log("4. Load the extension in Chrome or Brave");