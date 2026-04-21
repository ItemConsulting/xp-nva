import { serviceUrl } from "/lib/xp/portal";
import { list as listTasks } from "/lib/xp/task";
import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "/lib/nva";
import { connectToRepoAsAdmin } from "/lib/nva/contexts";
import { getResource, readText } from "/lib/xp/io";
import { render } from "/lib/freemarker";
import type { Response } from "@enonic-types/core";
import { FreeMarkerParams } from "/admin/tools/nva-import/nva-import.freemarker";

const styles = resolve("nva-import.css");
const view = resolve("nva-import.ftlh");

export function get(): Response {
  const institution = app.config.institution;
  const importUrl = serviceUrl({
    service: "import-all",
  });

  let resultCount = 0;
  try {
    const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);
    const totalResult = conn.query({
      query: `type = '${NODE_TYPE_NVA_RESULT}'`,
      count: 0,
    });
    resultCount = totalResult.total;
  } catch {
    // Repo may not exist yet
  }

  const runningTasks = listTasks({
    name: `${app.name}:import-nva-results`,
    state: "RUNNING",
  });
  const isRunning = runningTasks.length > 0;

  let progress: FreeMarkerParams["progress"];
  if (isRunning) {
    const p = runningTasks[0].progress;
    if (p && p.total > 0) {
      progress = {
        current: p.current,
        total: p.total,
        pct: Math.round((p.current / p.total) * 100),
        info: p.info,
      };
    }
  }

  const model: FreeMarkerParams = {
    resultCount,
    institution: institution ? String(institution) : undefined,
    importUrl,
    isRunning,
    progress,
    inlineStyle: readText(getResource(styles).getStream()),
  };

  return {
    body: render<FreeMarkerParams>(view, model),
    contentType: "text/html",
  };
}
