import { searchNvaResults } from "../../lib/nva/client";
import { lookupResult, searchLocalResults } from "../../lib/nva/storage";
import { extractUuidFromUri, getResultTitle, getCristinId, getPublicationYear } from "../../lib/nva/utils";
import type { NvaResult } from "../../lib/nva/types";

/**
 * Custom selector service for picking NVA results in Content Studio.
 */
function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function get(req: XP.Request): XP.Response {
  const query = paramString(req.params?.query).trim();
  const start = parseInt(paramString(req.params?.start) || "0", 10);
  const count = parseInt(paramString(req.params?.count) || "10", 10);
  const ids = paramString(req.params?.ids);

  // If specific IDs are requested, look them up
  if (ids) {
    const idList = ids.split(",").map((id: string) => id.trim());
    const hits = idList.map((id: string) => {
      const result = lookupResult(id);
      if (result) {
        return formatHit(result);
      }
      return { id, displayName: id, description: "Not found in local cache" };
    });

    return {
      status: 200,
      contentType: "application/json",
      body: { total: hits.length, count: hits.length, hits },
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
        body: { total: response.totalHits, count: hits.length, hits },
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
      body: { total: localResult.total, count: hits.length, hits },
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
        body: { total: response.totalHits, count: hits.length, hits },
      };
    }
  }

  // Empty result
  return {
    status: 200,
    contentType: "application/json",
    body: { total: 0, count: 0, hits: [] },
  };
}

function formatHit(result: NvaResult) {
  const stored = result as unknown as Record<string, unknown>;
  const resultId = result.id;
  // For stored nodes, id might be XP node id — check for entityDescription to detect stored structure
  const ed = stored.entityDescription as Record<string, unknown> | undefined;
  const uuid = resultId ? extractUuidFromUri(resultId) : "";
  const title = getResultTitle(result);
  const year = getPublicationYear(result);
  const cristinId = getCristinId(result);
  let type = result.type ?? "";
  // For stored nodes, get the publication instance type from entityDescription
  if (ed) {
    const ref = ed.reference as Record<string, unknown> | undefined;
    if (ref) {
      const pi = ref.publicationInstance as Record<string, string> | undefined;
      if (pi && pi.type) type = pi.type;
    }
  }

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
