import { run as runInContext } from "/lib/xp/context";
import { connect } from "/lib/xp/node";
import { REPO_BRANCH } from "./constants";
import type { PrincipalKey } from "/lib/xp/context";

const ADMIN_PRINCIPALS: PrincipalKey[] = [
  "role:system.admin",
  "role:system.authenticated",
  "role:system.everyone",
];

export function runAsSu<T>(fn: () => T): T {
  return runInContext(
    {
      user: {
        login: "su",
        idProvider: "system",
      },
      branch: REPO_BRANCH,
      principals: ADMIN_PRINCIPALS,
    },
    fn
  );
}

export function connectToRepoAsAdmin(repoId: string) {
  return connect({
    repoId,
    branch: REPO_BRANCH,
    principals: ADMIN_PRINCIPALS,
  });
}
