import { submitTask } from "/lib/xp/task";
import { ensureRepoExists } from "../../lib/nva/repos";

export function get() {
  if (!app.config.institution) {
    return {
      status: 400,
      body: 'Missing app config "institution" in no.item.xp.nva.cfg',
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
