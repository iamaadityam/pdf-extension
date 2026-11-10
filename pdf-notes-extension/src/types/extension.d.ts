/// <reference types="chrome" />

// Brave browser API declarations (extends Chrome APIs)
declare namespace chrome {
  // Brave-specific APIs (if any) would go here
  // Most Brave APIs are identical to Chrome's
}

// Firefox compatibility (if needed in future)
declare const browser: typeof chrome | undefined;
