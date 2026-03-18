import { create as createRepo, get as getRepo } from "/lib/xp/repo";
import { send } from "/lib/xp/event";
import type { RepoConnection } from "/lib/xp/node";
import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "./constants";
import { runAsSu, connectToRepoAsAdmin } from "./contexts";
import type { NvaResult, NvaResultNode } from "./types";

const PERMISSIONS = [
  {
    principal: "role:system.everyone",
    allow: ["READ"],
    deny: [] as Array<string>,
  },
  {
    principal: "role:system.authenticated",
    allow: ["READ", "CREATE", "MODIFY", "DELETE"],
    deny: [] as Array<string>,
  },
  {
    principal: "role:system.admin",
    allow: ["READ", "CREATE", "MODIFY", "DELETE", "PUBLISH", "READ_PERMISSIONS", "WRITE_PERMISSIONS"],
    deny: [] as Array<string>,
  },
];

/**
 * Ensures the NVA results repository exists. Returns true if it already existed.
 */
export function ensureRepoExists(): boolean {
  return runAsSu(() => {
    const existing = getRepo(REPO_NVA_RESULTS);
    if (existing) {
      return true;
    }
    createRepo({
      id: REPO_NVA_RESULTS,
      rootPermissions: PERMISSIONS,
    });
    log.info(`Created repository: ${REPO_NVA_RESULTS}`);
    return false;
  });
}

/**
 * Get the NVA node name from the result's NVA id (UUID from the URI).
 */
export function getNodeName(result: NvaResult): string {
  // NVA IDs are URIs like https://api.nva.unit.no/publication/<uuid>
  // Extract the UUID part
  const parts = result.id.split("/");
  return parts[parts.length - 1];
}

interface UpsertCounts {
  created: number;
  modified: number;
  unchanged: number;
  errors: number;
}

/**
 * Import an array of NVA results into the repo using upsert logic.
 */
export function importResults(results: Array<NvaResult>): UpsertCounts {
  const counts: UpsertCounts = { created: 0, modified: 0, unchanged: 0, errors: 0 };

  return runAsSu(() => {
    const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);

    for (const result of results) {
      try {
        const nodeName = getNodeName(result);
        const existing = getNodeByName(conn, nodeName);

        if (!existing) {
          conn.create({
            _name: nodeName,
            _parentPath: "/",
            data: result,
            type: NODE_TYPE_NVA_RESULT,
          });
          counts.created++;

          send({
            type: "custom.nva.result.create",
            distributed: false,
            data: { id: result.id, name: nodeName },
          });
        } else {
          const existingJson = JSON.stringify(existing.data);
          const newJson = JSON.stringify(result);

          if (existingJson !== newJson) {
            conn.modify({
              key: existing._id,
              editor: (node: NvaResultNode & Record<string, unknown>) => {
                node.data = result;
                node.removedFromNva = false;
                return node;
              },
            });
            counts.modified++;
          } else {
            counts.unchanged++;
          }
        }
      } catch (e) {
        log.warning(`Failed to upsert NVA result ${result.id}: ${e}`);
        counts.errors++;
      }
    }

    conn.refresh("ALL");
    return counts;
  });
}

/**
 * Look up a node by name (_name field) in the results repo.
 */
function getNodeByName(conn: RepoConnection, name: string): (NvaResultNode & { _id: string }) | undefined {
  const queryResult = conn.query({
    query: `_name = '${name}'`,
    count: 1,
  });

  if (queryResult.total === 0) {
    return undefined;
  }

  const node = conn.get(queryResult.hits[0].id);
  return node ?? undefined;
}

/**
 * Query all result node names in the repo (for refresh/update checks).
 */
export function getAllResultNodeNames(): Array<string> {
  return runAsSu(() => {
    const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);
    const names: Array<string> = [];
    let start = 0;
    const batchSize = 1000;

    while (true) {
      const result = conn.query({
        query: `type = '${NODE_TYPE_NVA_RESULT}' AND removedFromNva != 'true'`,
        start,
        count: batchSize,
      });

      for (const hit of result.hits) {
        const node = conn.get(hit.id);
        if (node && node._name) {
          names.push(node._name);
        }
      }

      if (start + batchSize >= result.total) break;
      start += batchSize;
    }

    return names;
  });
}
