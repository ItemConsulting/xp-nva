import { searchNvaResults } from "../../lib/nva/client";
import { importResults } from "../../lib/nva/repos";
import { DEFAULT_PAGE_SIZE, MAX_PAGES } from "../../lib/nva/constants";
import type { NvaResult } from "../../lib/nva/types";

export function run() {
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
  let page = 0;

  while (page < MAX_PAGES) {
    const response = searchNvaResults({
      institution,
      page,
      size: DEFAULT_PAGE_SIZE,
    });

    if (!response || !response.hits || response.hits.length === 0) {
      break;
    }

    const results: Array<NvaResult> = response.hits;
    totalFetched += results.length;

    const counts = importResults(results);
    totalCreated += counts.created;
    totalModified += counts.modified;
    totalUnchanged += counts.unchanged;
    totalErrors += counts.errors;

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

  log.info(
    `NVA import complete: total fetched=${totalFetched}, ` +
      `created=${totalCreated}, modified=${totalModified}, ` +
      `unchanged=${totalUnchanged}, errors=${totalErrors}`
  );
}
