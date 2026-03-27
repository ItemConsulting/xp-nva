import { serviceUrl } from "/lib/xp/portal";
import { list as listTasks } from "/lib/xp/task";
import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "../../../lib/nva/constants";
import { connectToRepoAsAdmin } from "../../../lib/nva/contexts";

export function get(): XP.Response {
  const institution = app.config.institution;
  const importUrl = serviceUrl({ service: "import-all" });

  let resultCount = 0;
  let staleCount = 0;
  try {
    const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);
    const totalResult = conn.query({
      query: "type = '" + NODE_TYPE_NVA_RESULT + "'",
      count: 0,
    });
    resultCount = totalResult.total;

    const staleResult = conn.query({
      query: "type = '" + NODE_TYPE_NVA_RESULT + "' AND removedFromNva = 'true'",
      count: 0,
    });
    staleCount = staleResult.total;
  } catch {
    // Repo may not exist yet
  }

  const runningTasks = listTasks({ name: app.name + ":import-nva-results", state: "RUNNING" });
  const isRunning = runningTasks.length > 0;
  let taskInfo = "";

  if (isRunning) {
    const task = runningTasks[0];
    const progress = task.progress;
    if (progress && progress.total > 0) {
      const pct = Math.round((progress.current / progress.total) * 100);
      taskInfo = "<p class=\"status running\">Import in progress: " + progress.current + " / " + progress.total + " (" + pct + "%)</p>";
      if (progress.info) {
        taskInfo += "<p class=\"status-detail\">" + escapeHtml(progress.info) + "</p>";
      }
    } else {
      taskInfo = "<p class=\"status running\">Import in progress...</p>";
    }
  }

  const configSection = institution
    ? "<p class=\"config\">Institution ID: <strong>" + escapeHtml(String(institution)) + "</strong></p>"
    : "<p class=\"status error\">Not configured. Add <code>institution=&lt;id&gt;</code> to <code>no.item.xp.nva.cfg</code></p>";

  const body = "<!doctype html>"
    + "<html><head>"
    + "<title>NVA Import</title>"
    + "<style>"
    + "body { font-family: 'Open Sans', sans-serif; margin: 0; padding: 24px 32px; background: #f5f5f5; color: #333; }"
    + "h1 { font-size: 22px; color: #1B264A; margin-bottom: 4px; }"
    + ".subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }"
    + ".card { background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }"
    + ".card h2 { font-size: 15px; color: #1B264A; margin: 0 0 12px 0; }"
    + ".stats { display: flex; gap: 24px; margin-bottom: 8px; }"
    + ".stat { text-align: center; }"
    + ".stat-value { font-size: 28px; font-weight: 700; color: #1B264A; }"
    + ".stat-label { font-size: 12px; color: #888; }"
    + ".config { font-size: 13px; color: #555; margin: 8px 0; }"
    + ".config code { background: #eee; padding: 2px 6px; border-radius: 3px; }"
    + ".btn { display: inline-block; padding: 10px 20px; background: #1B264A; color: #fff; border: none; border-radius: 6px; "
    + "font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; }"
    + ".btn:hover { background: #2a3a6a; }"
    + ".btn:disabled, .btn.disabled { background: #999; cursor: not-allowed; }"
    + ".status { font-size: 13px; margin: 8px 0; padding: 8px 12px; border-radius: 4px; }"
    + ".status.running { background: #fff3cd; color: #856404; }"
    + ".status.error { background: #fce4e4; color: #a02020; }"
    + ".status-detail { font-size: 12px; color: #666; margin: 4px 0 8px 0; }"
    + "</style>"
    + "</head><body>"
    + "<h1>NVA Import</h1>"
    + "<p class=\"subtitle\">Import publications from the National Research Archive</p>"
    + "<div class=\"card\">"
    + "<h2>Repository Status</h2>"
    + "<div class=\"stats\">"
    + "<div class=\"stat\"><div class=\"stat-value\">" + (resultCount - staleCount) + "</div><div class=\"stat-label\">Active results</div></div>"
    + "<div class=\"stat\"><div class=\"stat-value\">" + staleCount + "</div><div class=\"stat-label\">Stale results</div></div>"
    + "<div class=\"stat\"><div class=\"stat-value\">" + resultCount + "</div><div class=\"stat-label\">Total in repo</div></div>"
    + "</div>"
    + configSection
    + "</div>"
    + "<div class=\"card\">"
    + "<h2>Manual Import</h2>"
    + taskInfo
    + (institution
      ? (isRunning
        ? "<span class=\"btn disabled\">Import running...</span>"
        : "<a class=\"btn\" href=\"" + escapeHtml(importUrl) + "\">Start Import</a>")
      : "<p class=\"status error\">Configure institution before importing.</p>")
    + "</div>"
    + "</body></html>";

  return {
    body: body,
    contentType: "text/html",
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
