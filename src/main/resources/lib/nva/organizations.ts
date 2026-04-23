import { newCache } from "/lib/cache";
import { getOrganization } from "/lib/nva/client";
import { getSubstringAfterLast } from "/lib/nva/strings";
import { NVAAffiliation } from "/lib/nva/types";

const cache = newCache({
  size: 1000,
  expire: 60 * 60 * 24 * 7, // in a week
});

export function getOrganizationName(id: string): string | undefined {
  const topId = getTopOrganization(id);

  return cache.get(topId, () => {
    const organization = getOrganization(topId, "none");
    return organization?.labels.nb ?? organization?.labels.nn ?? organization?.labels.en;
  });
}

export function getOrganizationIdByAffiliation(affiliation: NVAAffiliation): string {
  return getSubstringAfterLast(affiliation.organization, "/");
}

export function getTopOrganization(orgId: string): string {
  return `${orgId.split(".")[0]}.0.0.0`;
}
