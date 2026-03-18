import { run as runInContext } from "/lib/xp/context";
import { connect } from "/lib/xp/node";
import { REPO_BRANCH } from "./constants";

const ADMIN_PRINCIPALS = [
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
