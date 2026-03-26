import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "../../lib/nva/constants";
import { connectToRepoAsAdmin } from "../../lib/nva/contexts";
import { forceArray } from "../../lib/nva/utils";
import type { NvaResultNode } from "../../lib/nva/types";

/**
 * Custom selector service for picking NVA contributors (persons) in Content Studio.
 * Returns Cristin person IDs as values, with contributor names as display names.
 */
export function get(req: XP.Request): XP.Response {
  const query = (req.params?.query ?? "").trim();
  const ids = req.params?.ids;
  const count = parseInt(req.params?.count ?? "20", 10);

  if (ids) {
    return lookupByIds(ids);
  }

  return searchContributors(query, count);
}

function lookupByIds(ids: string): XP.Response {
  const idList = ids.split(",").map((id) => id.trim());
  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);

  const hits = idList.map((cristinId) => {
    const contributorUri = `https://api.nva.unit.no/cristin/person/${cristinId}`;
    const result = conn.query({
      count: 1,
      query: `type = '${NODE_TYPE_NVA_RESULT}' AND data.entityDescription.contributorsPreview.identity.id = '${cristinId}'`
        + ` OR data.entityDescription.contributorsPreview.identity.id = '${contributorUri}'`,
    });

    if (result.total > 0) {
      const node = conn.get<NvaResultNode>(result.hits[0].id);
      if (node?.data) {
        const contributors = forceArray(node.data.entityDescription?.contributorsPreview ?? []);
        let match: typeof contributors[0] | undefined;
        for (let i = 0; i < contributors.length; i++) {
          const c = contributors[i];
          if (c.identity?.id === contributorUri || extractCristinId(c.identity?.id) === cristinId) {
            match = c;
            break;
          }
        }
        if (match?.identity?.name) {
          return { id: cristinId, displayName: match.identity.name, description: `Cristin ID: ${cristinId}` };
        }
      }
    }

    return { id: cristinId, displayName: `Person ${cristinId}`, description: "Cristin ID" };
  });

  return jsonResponse({ total: hits.length, count: hits.length, hits });
}

function searchContributors(query: string, count: number): XP.Response {
  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);

  // Query NVA results that have matching contributor names
  const noqlQuery = query
    ? `type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'`
      + ` AND fulltext('data.entityDescription.contributorsPreview.identity.name', '${escapeNoql(query)}', 'AND')`
    : `type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'`;

  const result = conn.query({
    query: noqlQuery,
    count: 100, // Fetch more to extract unique contributors
    sort: "data.entityDescription.publicationDate.year DESC",
  });

  // Collect unique contributors across all matching results
  const seen: Record<string, { id: string; displayName: string; description: string }> = {};
  let seenCount = 0;

  for (let h = 0; h < result.hits.length; h++) {
    const node = conn.get<NvaResultNode>(result.hits[h].id);
    if (!node?.data) continue;

    const contributors = forceArray(node.data.entityDescription?.contributorsPreview ?? []);
    for (let i = 0; i < contributors.length; i++) {
      const c = contributors[i];
      const name = c.identity?.name;
      const uri = c.identity?.id;
      if (!name || !uri) continue;

      const cristinId = extractCristinId(uri);
      if (!cristinId || seen[cristinId]) continue;

      // If searching, filter by name match
      if (query && name.toLowerCase().indexOf(query.toLowerCase()) === -1) continue;

      seen[cristinId] = {
        id: cristinId,
        displayName: name,
        description: "Cristin ID: " + cristinId,
      };
      seenCount++;

      if (seenCount >= count) break;
    }

    if (seenCount >= count) break;
  }

  const hits: Array<{ id: string; displayName: string; description: string }> = [];
  for (const key in seen) {
    if (seen.hasOwnProperty(key)) {
      hits.push(seen[key]);
    }
  }
  return jsonResponse({ total: hits.length, count: hits.length, hits });
}

function extractCristinId(uri?: string): string | undefined {
  if (!uri) return undefined;
  const match = uri.match(/\/(\d+)$/);
  return match ? match[1] : undefined;
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
