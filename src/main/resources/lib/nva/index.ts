// Public API for the NVA library
export { searchNvaResults, fetchNvaSearchUrl } from "./client";
export { ensureRepoExists, importResults, markStaleResults, getNodeName } from "./repos";
export type { UpsertCounts } from "./repos";
export { lookupResult, lookupResults, searchLocalResults, lookupResultsByContributor } from "./storage";
export { notNullOrUndefined, forceArray, extractUuidFromUri, getResultTitle, getCristinId, getPublicationYear, stableStringify } from "./utils";
export {
  NVA_BASE_URL,
  NVA_SEARCH_URL,
  REPO_NVA_RESULTS,
  NODE_TYPE_NVA_RESULT,
  REPO_BRANCH,
  DEFAULT_PAGE_SIZE,
  MAX_PAGES,
} from "./constants";
export type {
  NvaSearchResponse,
  NvaResult,
  NvaOtherIdentifiers,
  NvaRecordMetadata,
  NvaPublicationDate,
  NvaContributorPreview,
  NvaAffiliation,
  NvaIdentity,
  NvaPublishingDetails,
  NvaPublishingSeries,
  NvaPublisher,
  NvaSearchParams,
  NvaResultNode,
  NvaFacet,
} from "./types";
