export interface NormalizedURLResult {
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
