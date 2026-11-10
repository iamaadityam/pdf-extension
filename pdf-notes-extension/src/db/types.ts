export type NoteLabel = "key_idea" | "definition" | "question" | "quote" | "other";

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
