import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "./constants";
import { connectToRepoAsAdmin } from "./contexts";
import type { NvaResult, NvaResultNode } from "./types";

function escapeNoql(value: string): string {
  return value.replace(/'/g, "\\'");
}

/**
 * Look up a single NVA result by node name (UUID).
 */
export function lookupResult(name: string): NvaResult | undefined {
  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);
  const escapedName = escapeNoql(name);
  const queryResult = conn.query({
    query: `_name = '${escapedName}' AND type = '${NODE_TYPE_NVA_RESULT}'`,
    count: 1,
  });

  if (queryResult.total === 0) return undefined;

  const node = conn.get<NvaResultNode>(queryResult.hits[0].id);
  return node?.data;
}

/**
 * Look up multiple NVA results by node names (UUIDs).
 * Uses a single batch query instead of per-name queries.
 */
export function lookupResults(names: Array<string>): Array<NvaResult> {
  if (names.length === 0) return [];

  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);
  const nameConditions = names.map((n) => `_name = '${escapeNoql(n)}'`).join(" OR ");
  const queryResult = conn.query({
    query: `(${nameConditions}) AND type = '${NODE_TYPE_NVA_RESULT}'`,
    count: names.length,
  });

  if (queryResult.total === 0) return [];

  const ids = queryResult.hits.map((hit) => hit.id);
  const nodes = conn.get<NvaResultNode>(ids);
  const results: Array<NvaResult> = [];

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (node?.data) results.push(node.data);
    }
  } else if (nodes?.data) {
    results.push(nodes.data);
  }

  return results;
}

/**
 * Search results in the local repo by a text query (matches mainTitle).
 */
export function searchLocalResults(
  query: string,
  start = 0,
  count = 10
): { total: number; results: Array<NvaResult> } {
  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);

  const escapedQuery = escapeNoql(query);
  const queryResult = conn.query({
    query: `type = '${NODE_TYPE_NVA_RESULT}'` +
      (query ? ` AND fulltext('data.entityDescription.mainTitle', '${escapedQuery}', 'AND')` : ""),
    start,
    count,
    sort: "data.entityDescription.publicationDate.year DESC",
  });

  const results = batchGetResults(conn, queryResult.hits);
  return { total: queryResult.total, results };
}

/**
 * Look up results by contributor Cristin person ID.
 */
export function lookupResultsByContributor(
  contributorUri: string,
  start = 0,
  count = 10
): { total: number; results: Array<NvaResult> } {
  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);

  const escapedUri = escapeNoql(contributorUri);
  const queryResult = conn.query({
    query: `type = '${NODE_TYPE_NVA_RESULT}'` +
      ` AND data.entityDescription.contributorsPreview.identity.id = '${escapedUri}'`,
    start,
    count,
    sort: "data.entityDescription.publicationDate.year DESC",
  });

  const results = batchGetResults(conn, queryResult.hits);
  return { total: queryResult.total, results };
}

/**
 * Batch-fetch nodes by query hits and extract their data.
 */
function batchGetResults(
  conn: ReturnType<typeof connectToRepoAsAdmin>,
  hits: Array<{ id: string }>
): Array<NvaResult> {
  if (hits.length === 0) return [];

  const ids = hits.map((hit) => hit.id);
  const nodes = conn.get<NvaResultNode>(ids);
  const results: Array<NvaResult> = [];

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (node?.data) results.push(node.data);
    }
  } else if (nodes?.data) {
    results.push(nodes.data);
  }

  return results;
}
