import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "../../lib/nva/constants";
import { connectToRepoAsAdmin } from "../../lib/nva/contexts";
import type { NvaResultNode } from "../../lib/nva/types";
import { forceArray } from "../../lib/nva/utils";

/**
 * Custom selector service for picking NVA funding identifiers in Content Studio.
 * Searches the local NVA results repo for unique funding project codes.
 */
export function get(req: XP.Request): XP.Response {
  const query = (req.params?.query ?? "").trim().slice(0, 500);
  const ids = req.params?.ids;
  const count = Math.min(100, Math.max(1, parseInt(req.params?.count ?? "20", 10) || 20));

  if (ids) {
    return lookupByIds(ids);
  }

  return searchFunding(query, count);
}

function lookupByIds(ids: string): XP.Response {
  const idList = ids.split(",").map((id) => id.trim());
  const hits = idList.map((id) => ({
    id,
    displayName: id,
    description: "Funding identifier",
  }));

  return jsonResponse({ total: hits.length, count: hits.length, hits });
}

function searchFunding(query: string, count: number): XP.Response {
  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);

  // Query results that have funding data
  const noqlQuery = query
    ? `type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'`
      + ` AND data.fundings.identifier LIKE '*${escapeNoql(query)}*'`
    : `type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'`
      + ` AND data.fundings.identifier LIKE '*'`;

  const result = conn.query({
    query: noqlQuery,
    count: 200,
    sort: "data.entityDescription.publicationDate.year DESC",
  });

  // Batch-fetch all matching nodes
  const hitIds = result.hits.map((h) => h.id);
  const nodes = hitIds.length > 0 ? forceArray(conn.get<NvaResultNode>(hitIds)).filter((n) => n?.data) : [];

  // Collect unique funding identifiers
  const seen: Record<string, { id: string; displayName: string; description: string }> = {};
  let seenCount = 0;

  for (let h = 0; h < nodes.length; h++) {
    const node = nodes[h];

    const fundings = forceArray((node.data as Record<string, unknown>).fundings as Array<{ identifier?: string; source?: string }> ?? []);
    for (let i = 0; i < fundings.length; i++) {
      const f = fundings[i];
      const identifier = f.identifier;
      if (!identifier || seen[identifier]) continue;

      if (query && identifier.toLowerCase().indexOf(query.toLowerCase()) === -1) continue;

      const sourceObj = f.source as unknown;
      let sourceName = "";
      if (sourceObj && typeof sourceObj === "object") {
        const s = sourceObj as Record<string, unknown>;
        // source.labels.en or source.labels.nb or source.identifier
        const labels = s.labels as Record<string, string> | undefined;
        if (labels) {
          sourceName = labels.en || labels.nb || "";
        }
        if (!sourceName && typeof s.identifier === "string") {
          sourceName = s.identifier;
        }
      } else if (typeof sourceObj === "string") {
        sourceName = sourceObj;
      }
      seen[identifier] = {
        id: identifier,
        displayName: identifier,
        description: sourceName ? "Source: " + sourceName : "Funding identifier",
      };
      seenCount++;

      if (seenCount >= count) break;
    }

    if (seenCount >= count) break;
  }

  const hits: Array<{ id: string; displayName: string; description: string }> = [];
  for (const key in seen) {
    if (Object.hasOwn(seen, key)) {
      hits.push(seen[key]);
    }
  }
  return jsonResponse({ total: hits.length, count: hits.length, hits });
}

function escapeNoql(value: string): string {
  return value.replace(/'/g, "\\'");
}

function jsonResponse(body: unknown): XP.Response {
  return {
    status: 200,
    contentType: "application/json",
    body,
  };
}
