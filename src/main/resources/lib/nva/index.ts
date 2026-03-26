// Public API for the NVA library
export { searchNvaResults, fetchNvaSearchUrl } from "./client";
export { ensureRepoExists, importResults, markStaleResults, getNodeName } from "./repos";
export type { UpsertCounts } from "./repos";
export { lookupResult, lookupResults, searchLocalResults, lookupResultsByContributor } from "./storage";
export { notNullOrUndefined, forceArray, extractUuidFromUri, getResultTitle, getCristinId, getPublicationYear, stableStringify } from "./utils";
export {
  NVA_SEARCH_URL,
  REPO_NVA_RESULTS,
  NODE_TYPE_NVA_RESULT,
  DEFAULT_PAGE_SIZE,
  MAX_PAGES,
} from "./constants";
export type {
  NvaSearchResponse,
  NvaResult,
  NvaPublicationDate,
  NvaContributorPreview,
  NvaIdentity,
  NvaSearchParams,
  NvaResultNode,
} from "./types";
