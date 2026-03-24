import { serviceUrl } from "/lib/xp/portal";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function get(): XP.Response {
  const importUrl = serviceUrl({ service: "import-all" });

  const markup = app.config.institution
    ? `<a href="${escapeHtml(importUrl)}" target="_blank">Start importing all NVA data for institution with id=${escapeHtml(String(app.config.institution))}</a>`
    : `Please configure "no.item.xp.nva.cfg" with "institution=&lt;your-institution-number&gt;"`;

  return {
    body: `<widget>${markup}</widget>`,
    contentType: "text/html",
  };
}
