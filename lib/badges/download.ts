/**
 * Trigger a file download in the browser by creating a temporary anchor.
 * Works for both same-origin URLs and blob/data URLs.
 */
export function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
