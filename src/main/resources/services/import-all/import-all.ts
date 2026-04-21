import { submitTask, list as listTasks } from "/lib/xp/task";
import { ensureRepoExists } from "/lib/nva";

const IMPORT_TASK_NAME = `${app.name}:import-nva-results`;

export function get() {
  if (!app.config.institution) {
    return {
      status: 400,
      body: 'Missing app config "institution" in no.item.xp.nva.cfg',
      contentType: "text/plain",
    };
  }

  const runningImports = listTasks({ state: "RUNNING" }).filter((t) => t.name === IMPORT_TASK_NAME);
  if (runningImports.length > 0) {
    return {
      status: 409,
      body: "NVA import is already running",
      contentType: "text/plain",
    };
  }

  ensureRepoExists();

  submitTask({
    descriptor: "import-nva-results",
    config: {},
  });

  return {
    body: `Started import from NVA for institution=${app.config.institution}`,
    contentType: "text/html",
  };
}
