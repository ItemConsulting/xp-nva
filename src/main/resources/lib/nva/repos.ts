import { create as createRepo, get as getRepo, type AccessControlEntry } from "/lib/xp/repo";
import { send } from "/lib/xp/event";
import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "./constants";
import { runAsSu, connectToRepoAsAdmin } from "./contexts";
import { stableStringify } from "./utils";
import type { RepoConnection } from "/lib/xp/node";
import type { NvaResult, NvaResultNode } from "./types";

const PERMISSIONS: AccessControlEntry[] = [
  {
    principal: "role:system.everyone",
    allow: ["READ"],
  },
  {
    principal: "role:system.authenticated",
    allow: ["READ"],
  },
  {
    principal: "role:system.admin",
    allow: ["READ", "CREATE", "MODIFY", "DELETE", "PUBLISH", "READ_PERMISSIONS", "WRITE_PERMISSIONS"],
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

export interface UpsertCounts {
  created: number;
  modified: number;
  unchanged: number;
  errors: number;
  importedNames: Array<string>;
}

/**
 * Import an array of NVA results into the repo using upsert logic.
 */
export function importResults(results: Array<NvaResult>): UpsertCounts {
  const counts: UpsertCounts = {
    created: 0,
    modified: 0,
    unchanged: 0,
    errors: 0,
    importedNames: [],
  };

  return runAsSu(() => {
    const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);

    for (const result of results) {
      try {
        const nodeName = getNodeName(result);
        counts.importedNames.push(nodeName);
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
          const existingModified = existing.data?.recordMetadata?.modifiedDate;
          const newModified = result.recordMetadata?.modifiedDate;

          const hasChanged =
            existingModified !== newModified || stableStringify(existing.data) !== stableStringify(result);

          if (hasChanged) {
            conn.modify<NvaResultNode>({
              key: existing._id,
              editor: (node) => {
                node.data = result;
                return node;
              },
            });
            counts.modified++;

            send({
              type: "custom.nva.result.modify",
              distributed: false,
              data: { id: result.id, name: nodeName },
            });
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
 * Delete nodes that weren't seen in the current import.
 * Returns the number of nodes deleted.
 */
export function deleteStaleResults(importedNames: Array<string>): number {
  return runAsSu(() => {
    const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);
    const importedSet: Record<string, boolean> = {};
    for (const name of importedNames) {
      importedSet[name] = true;
    }

    // Safety check: count existing results and refuse to delete if imported set
    // is less than 50% of existing results (likely incomplete import)
    const activeCount = conn.query({
      query: `type = '${NODE_TYPE_NVA_RESULT}'`,
      count: 0,
    }).total;

    if (activeCount > 0 && importedNames.length < activeCount * 0.5) {
      log.warning(
        `Skipping stale deletion: imported ${importedNames.length} results but repo has ${activeCount} results. ` +
          `This looks like an incomplete import (threshold: 50%).`,
      );
      return 0;
    }

    let deletedCount = 0;
    let start = 0;
    const batchSize = 1000;

    while (true) {
      const result = conn.query({
        query: `type = '${NODE_TYPE_NVA_RESULT}'`,
        start,
        count: batchSize,
      });

      if (result.hits.length === 0) break;

      const ids = result.hits.map((h) => h.id);
      const nodes = conn.get<NvaResultNode>(ids);
      const nodeArray = Array.isArray(nodes) ? nodes : nodes ? [nodes] : [];

      const toDelete: Array<string> = [];
      for (const node of nodeArray) {
        if (node && !importedSet[node._name]) {
          toDelete.push(node._id);
        }
      }

      for (const id of toDelete) {
        conn.delete(id);
        deletedCount++;
      }

      if (start + batchSize >= result.total) break;
      start += batchSize;
    }

    if (deletedCount > 0) {
      conn.refresh("ALL");
      log.info(`Deleted ${deletedCount} stale results from NVA repo`);
    }

    return deletedCount;
  });
}

/**
 * Look up a node by name (_name field) in the results repo.
 */
function getNodeByName(conn: RepoConnection, name: string) {
  const escapedName = name.replace(/'/g, "\\'");
  const queryResult = conn.query({
    query: `_name = '${escapedName}'`,
    count: 1,
  });

  if (queryResult.total === 0) {
    return undefined;
  }

  return conn.get<NvaResultNode>(queryResult.hits[0].id) ?? undefined;
}
