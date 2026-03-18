import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "./constants";
import { connectToRepoAsAdmin } from "./contexts";
import type { NvaResult, NvaResultNode } from "./types";

/**
 * Look up a single NVA result by node name (UUID).
 */
export function lookupResult(name: string): NvaResult | undefined {
  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);
  const queryResult = conn.query({
    query: `_name = '${name}' AND type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'`,
    count: 1,
  });

  if (queryResult.total === 0) return undefined;

  const node = conn.get<NvaResultNode>(queryResult.hits[0].id);
  return node?.data;
}

/**
 * Look up multiple NVA results by node names (UUIDs).
 */
export function lookupResults(names: Array<string>): Array<NvaResult> {
  if (names.length === 0) return [];

  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);
  const results: Array<NvaResult> = [];

  for (const name of names) {
    const queryResult = conn.query({
      query: `_name = '${name}' AND type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'`,
      count: 1,
    });

    if (queryResult.total > 0) {
      const node = conn.get<NvaResultNode>(queryResult.hits[0].id);
      if (node?.data) {
        results.push(node.data);
      }
    }
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

  const escapedQuery = query.replace(/'/g, "\\'");
  const queryResult = conn.query({
    query: `type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'` +
      (query ? ` AND fulltext('data.mainTitle', '${escapedQuery}', 'AND')` : ""),
    start,
    count,
    sort: "data.publicationDate.year DESC",
  });

  const results: Array<NvaResult> = [];
  for (const hit of queryResult.hits) {
    const node = conn.get<NvaResultNode>(hit.id);
    if (node?.data) {
      results.push(node.data);
    }
  }

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

  const escapedUri = contributorUri.replace(/'/g, "\\'");
  const queryResult = conn.query({
    query: `type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'` +
      ` AND data.contributorsPreview.identity.id = '${escapedUri}'`,
    start,
    count,
    sort: "data.publicationDate.year DESC",
  });

  const results: Array<NvaResult> = [];
  for (const hit of queryResult.hits) {
    const node = conn.get<NvaResultNode>(hit.id);
    if (node?.data) {
      results.push(node.data);
    }
  }

  return { total: queryResult.total, results };
}
