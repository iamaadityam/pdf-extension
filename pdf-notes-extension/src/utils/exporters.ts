import { PDFDocumentRecord, NoteRecord, SourceRecord } from "../db/types";

export function exportToMarkdown(doc: PDFDocumentRecord, notes: NoteRecord[], sources: SourceRecord[]): string {
  const lines: string[] = [];

  lines.push(`# ${doc.name}`);
  lines.push(`*Exported on ${new Date().toLocaleDateString()} — Total Notes: ${notes.length}*\n`);

  if (sources.length > 0) {
    lines.push(`## Sources`);
    sources.forEach(s => lines.push(`- [${s.displayUrl}](${s.displayUrl}) (${s.sourceType})`));
    lines.push("");
  }

  lines.push(`## Captured Notes\n`);

  notes.forEach((n, i) => {
    lines.push(`### Note ${i + 1} [${n.label.toUpperCase()}]`);
    if (n.pageReference) {
      lines.push(`**Page:** ${n.pageReference}`);
    }
    lines.push(`> ${n.capturedText.replace(/\n/g, "\n> ")}\n`);
    if (n.comment) {
      lines.push(`**Comment:** ${n.comment}\n`);
    }
    if (n.tags && n.tags.length > 0) {
      lines.push(`**Tags:** ${n.tags.map(t => `#${t}`).join(" ")}\n`);
    }
    lines.push("---\n");
  });

  return lines.join("\n");
}

export function exportToDocxHtml(doc: PDFDocumentRecord, notes: NoteRecord[]): Blob {
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>${escapeXml(doc.name)}</title>
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
      <h1>${escapeXml(doc.name)}</h1>
      <p class="meta">Exported on ${new Date().toLocaleDateString()} | ${notes.length} Notes</p>
      <hr/>
      ${notes.map((n, i) => `
        <div>
          <h2>Note ${i + 1} <span class="label">(${n.label})</span></h2>
          ${n.pageReference ? `<p class="meta">Page Reference: ${escapeXml(n.pageReference)}</p>` : ''}
          <blockquote>${escapeXml(n.capturedText).replace(/\n/g, '<br/>')}</blockquote>
          ${n.comment ? `<p><strong>Comment:</strong> ${escapeXml(n.comment)}</p>` : ''}
          ${n.tags.length ? `<p class="meta">Tags: ${escapeXml(n.tags.join(', '))}</p>` : ''}
        </div>
      `).join('<br/>')}
    </body>
    </html>
  `;

  return new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
}

export function printPdfDocument(doc: PDFDocumentRecord, notes: NoteRecord[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeXml(doc.name)} - Notes</title>
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
      <h1>${escapeXml(doc.name)}</h1>
      <p class="meta">Exported on ${new Date().toLocaleDateString()} | Total Notes: ${notes.length}</p>
      ${notes.map(n => `
        <div class="note">
          <div><span class="badge">${n.label.toUpperCase()}</span> ${n.pageReference ? `<span class="meta">| Page ${escapeXml(n.pageReference)}</span>` : ''}</div>
          <div class="quote">${escapeXml(n.capturedText)}</div>
          ${n.comment ? `<p><strong>Comment:</strong> ${escapeXml(n.comment)}</p>` : ''}
          ${n.tags.length ? `<p class="meta">Tags: ${escapeXml(n.tags.join(', '))}</p>` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `);

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
