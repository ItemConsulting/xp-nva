import { searchNvaResults } from "../../lib/nva/client";
import { searchLocalResults } from "../../lib/nva/storage";
import { extractUuidFromUri, getResultTitle, getCristinId, getPublicationYear } from "../../lib/nva/utils";
import type { NvaResult } from "../../lib/nva/types";

/**
 * Custom selector service for picking NVA results in Content Studio.
 */
export function get(req: XP.Request): XP.Response {
  const query = (req.params?.query ?? "").trim();
  const start = parseInt(req.params?.start ?? "0", 10);
  const count = parseInt(req.params?.count ?? "10", 10);
  const ids = req.params?.ids;

  // If specific IDs are requested, look them up
  if (ids) {
    const idList = ids.split(",").map((id: string) => id.trim());
    const hits = idList.map((id: string) => {
      const localResult = searchLocalResults(id, 0, 1);
      if (localResult.results.length > 0) {
        return formatHit(localResult.results[0]);
      }
      return { id, displayName: id, description: "Not found in local cache" };
    });

    return {
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: hits.length, count: hits.length, hits }),
    };
  }

  // If query is a number, try searching by Cristin ID via the NVA API
  if (/^\d+$/.test(query)) {
    const response = searchNvaResults({
      cristin_identifier: query,
      size: count,
      page: start,
    });

    if (response && response.hits.length > 0) {
      const hits = response.hits.map(formatHit);
      return {
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: response.totalHits, count: hits.length, hits }),
      };
    }
  }

  // Search locally first
  const localResult = searchLocalResults(query, start, count);

  if (localResult.total > 0) {
    const hits = localResult.results.map(formatHit);
    return {
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: localResult.total, count: hits.length, hits }),
    };
  }

  // Fall back to NVA API search
  if (query) {
    const response = searchNvaResults({
      query,
      size: count,
      page: start,
    });

    if (response) {
      const hits = response.hits.map(formatHit);
      return {
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: response.totalHits, count: hits.length, hits }),
      };
    }
  }

  // Empty result
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ total: 0, count: 0, hits: [] }),
  };
}

function formatHit(result: NvaResult) {
  const uuid = extractUuidFromUri(result.id);
  const title = getResultTitle(result);
  const year = getPublicationYear(result);
  const cristinId = getCristinId(result);
  const type = result.type ?? "";

  const descParts: Array<string> = [];
  if (type) descParts.push(type);
  if (year) descParts.push(year);
  if (cristinId) descParts.push(`Cristin: ${cristinId}`);

  return {
    id: uuid,
    displayName: title,
    description: descParts.join(" | "),
  };
}
