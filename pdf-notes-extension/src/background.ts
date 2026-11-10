import { db } from "./db/database";
import { normalizePdfUrl } from "./utils/url";
import { BrowserDetector } from "./utils/browser";

const CONTEXT_MENU_ID = "pdf-notes-capture";
const MAX_SELECTION_LENGTH = 100000;

chrome.runtime.onInstalled.addListener(() => {
  const browser = BrowserDetector.getCurrentBrowser();
  console.log(`PDF Notes installed on ${browser}`);
  
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
