import { PDFDocumentRecord, SourceRecord, NoteRecord, TabContextRecord, SettingRecord, ExportBackupData } from "./types";

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

  async getAllSources(): Promise<SourceRecord[]> {
    const store = await this.getStore("sources");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllNotes(): Promise<NoteRecord[]> {
    const store = await this.getStore("notes");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllSettings(): Promise<SettingRecord[]> {
    const store = await this.getStore("settings");
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
      await new Promise<void>((resolve, reject) => {
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

    return new Promise<void>((resolve, reject) => {
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

    return new Promise<void>((resolve, reject) => {
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
      await new Promise<void>(r => {
        tx.oncomplete = () => r();
      });
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

    await new Promise<void>(r => {
      tx.oncomplete = () => r();
    });
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
    return new Promise<void>((resolve, reject) => {
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    const store = await this.getStore("notes", "readwrite");
    return new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async setTabContext(tabId: number, documentId: string, sourceId: string): Promise<void> {
    const store = await this.getStore("tabContexts", "readwrite");
    const record: TabContextRecord = { tabId, documentId, sourceId, updatedAt: Date.now() };
    return new Promise<void>((resolve, reject) => {
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
    return new Promise<void>((resolve, reject) => {
      const req = store.delete(tabId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async exportJSONBackup(): Promise<ExportBackupData> {
    const docs = await this.getAllDocuments();
    const sources = await this.getAllSources();
    const notes = await this.getAllNotes();
    const settings = await this.getAllSettings();

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      documents: docs,
      sources,
      notes,
      settings
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

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const db = new Database();
