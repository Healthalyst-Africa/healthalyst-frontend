/**
 * The page a service worker shows when a page cannot load offline.
 *
 * It is plain HTML with inline styles and no JavaScript. The service worker
 * serves it at whatever address failed, so a framework page would start its
 * router there, try to load that address and fail again. This page depends
 * only on itself and on an icon stored at install.
 */

export type OfflineDocumentContent = {
  /** The app's name, shown in the browser tab. */
  applicationName: string;
  title: string;
  description: string;
  retryLabel: string;
  /** A stored icon, such as `/icons/icon-192.png`. */
  iconPath: string;
  colours: {
    primary: string;
    onPrimary: string;
    text: string;
    secondaryText: string;
    background: string;
  };
};

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? "");
}

export function createOfflineDocument(content: OfflineDocumentContent): string {
  const title = escapeHtml(content.title);
  const { colours } = content;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="${escapeHtml(colours.primary)}">
<title>${title} | ${escapeHtml(content.applicationName)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 1.5rem;
    background: ${colours.background};
    color: ${colours.text};
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    text-align: center;
  }
  main { max-width: 28rem; display: flex; flex-direction: column; align-items: center; }
  img { width: 4rem; height: 4rem; border-radius: 0.75rem; }
  h1 {
    margin: 2rem 0 0;
    font-family: "Young Serif", Georgia, "Times New Roman", serif;
    font-size: 2rem;
    font-weight: 400;
    line-height: 1.2;
  }
  p { margin: 0.75rem 0 0; color: ${colours.secondaryText}; font-size: 1.0625rem; line-height: 1.6; }
  a {
    margin-top: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    padding: 0 2rem;
    border-radius: 9999px;
    background: ${colours.primary};
    color: ${colours.onPrimary};
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  a:hover { opacity: 0.9; }
  a:focus-visible { outline: 2px solid ${colours.primary}; outline-offset: 2px; }
</style>
</head>
<body>
<main>
  <img src="${escapeHtml(content.iconPath)}" alt="" width="64" height="64">
  <h1>${title}</h1>
  <p>${escapeHtml(content.description)}</p>
  <!-- An empty address reloads the page that could not load. -->
  <a href="">${escapeHtml(content.retryLabel)}</a>
</main>
</body>
</html>
`;
}
