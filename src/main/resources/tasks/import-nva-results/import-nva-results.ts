import { progress, list as listTasks } from "/lib/xp/task";
import { searchNvaResults } from "../../lib/nva/client";
import { importResults, markStaleResults } from "../../lib/nva/repos";
import { DEFAULT_PAGE_SIZE, MAX_PAGES } from "../../lib/nva/constants";
import type { NvaResult } from "../../lib/nva/types";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;
const IMPORT_TASK_NAME = `${app.name}:import-nva-results`;

function isImportAlreadyRunning(): boolean {
  const runningTasks = listTasks({ state: "RUNNING" });
  // If more than 1 task with this name is running, another instance started first
  return runningTasks.filter((t) => t.name === IMPORT_TASK_NAME).length > 1;
}

export function run() {
  if (isImportAlreadyRunning()) {
    log.info("NVA import is already running — skipping this run.");
    return;
  }
  const institution = app.config?.["institution"] ?? "";
  if (!institution) {
    log.warning("No institution configured in app.config. Skipping NVA import.");
    return;
  }

  log.info(`Starting NVA results import for institution: ${institution}`);

  let totalFetched = 0;
  let totalCreated = 0;
  let totalModified = 0;
  let totalUnchanged = 0;
  let totalErrors = 0;
  const allImportedNames: Array<string> = [];
  let page = 0;
  let consecutiveFailures = 0;
  let importAborted = false;

  // First pass: estimate total by fetching page 0
  progress({ info: "Starting NVA import...", current: 0, total: MAX_PAGES });

  while (page < MAX_PAGES) {
    const response = fetchWithRetry(institution, page);

    if (!response || !response.hits || response.hits.length === 0) {
      if (!response) {
        consecutiveFailures++;
        if (consecutiveFailures >= 3) {
          log.warning(`NVA import aborting after ${consecutiveFailures} consecutive API failures at page ${page}`);
          importAborted = true;
          break;
        }
        // Skip this page and try the next
        page++;
        continue;
      }
      break;
    }

    consecutiveFailures = 0;
    const results: Array<NvaResult> = response.hits;
    totalFetched += results.length;

    const counts = importResults(results);
    totalCreated += counts.created;
    totalModified += counts.modified;
    totalUnchanged += counts.unchanged;
    totalErrors += counts.errors;
    allImportedNames.push(...counts.importedNames);

    const estimatedTotal = Math.min(
      Math.ceil(response.totalHits / DEFAULT_PAGE_SIZE),
      MAX_PAGES
    );

    progress({
      info: `Imported page ${page + 1}/${estimatedTotal} (${totalFetched} results)`,
      current: page + 1,
      total: estimatedTotal,
    });

    log.info(
      `NVA import page ${page + 1}: fetched=${results.length}, ` +
        `created=${counts.created}, modified=${counts.modified}, ` +
        `unchanged=${counts.unchanged}, errors=${counts.errors}`
    );

    if (results.length < DEFAULT_PAGE_SIZE || totalFetched >= response.totalHits) {
      break;
    }

    page++;
  }

  // Mark stale results that were not seen in this import (only if import completed fully)
  let totalStale = 0;
  if (allImportedNames.length > 0 && !importAborted) {
    progress({ info: "Marking stale results...", current: page + 1, total: page + 2 });
    totalStale = markStaleResults(allImportedNames);
  } else if (importAborted) {
    log.warning("Skipping stale-marking because the import was aborted — partial imports may produce false positives");
  }

  progress({
    info: "NVA import complete",
    current: 1,
    total: 1,
  });

  log.info(
    `NVA import complete: total fetched=${totalFetched}, ` +
      `created=${totalCreated}, modified=${totalModified}, ` +
      `unchanged=${totalUnchanged}, errors=${totalErrors}, ` +
      `stale=${totalStale}`
  );
}

function fetchWithRetry(institution: string, page: number, retries = 0): ReturnType<typeof searchNvaResults> {
  const response = searchNvaResults({
    institution,
    page,
    size: DEFAULT_PAGE_SIZE,
  });

  if (response) return response;

  if (retries < MAX_RETRIES) {
    log.warning(`NVA API call failed for page ${page}, retrying (${retries + 1}/${MAX_RETRIES})...`);
    java.lang.Thread.sleep(RETRY_DELAY_MS);
    return fetchWithRetry(institution, page, retries + 1);
  }

  log.warning(`NVA API call failed for page ${page} after ${MAX_RETRIES} retries`);
  return undefined;
}
