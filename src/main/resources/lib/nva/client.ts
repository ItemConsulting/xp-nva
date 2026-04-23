import { request as httpRequest } from "/lib/http-client";
import { NVA_SEARCH_URL, DEFAULT_PAGE_SIZE, HTTP_TIMEOUT } from "./constants";
import type { NVAPerson, NVAPersonSearch, NvaSearchParams, NvaSearchResponse } from "./types";

const SEARCH_PARAM_KEYS = [
  "query",
  "title",
  "institution",
  "top_level_organization",
  "contributor",
  "contributor_name",
  "category",
  "doi",
  "issn",
  "isbn",
  "funding_source",
  "funding_identifier",
  "publication_year",
  "publication_year_since",
  "publication_year_before",
  "published_since",
  "published_before",
  "modified_since",
  "cristin_identifier",
  "unit",
  "sort",
  "order",
] as const;

/**
 * Calls the NVA public search API (/search/resources).
 * Returns the parsed response or undefined on error.
 */
export function searchNvaResults(params: NvaSearchParams): NvaSearchResponse | undefined {
  const queryParams: Record<string, string> = {};

  for (const key of SEARCH_PARAM_KEYS) {
    if (params[key]) queryParams[key] = String(params[key]);
  }

  queryParams.page = String(params.page ?? 0);
  queryParams.per_page = String(params.size ?? DEFAULT_PAGE_SIZE);
  queryParams.aggregation = "none";

  return fetchNvaSearch(NVA_SEARCH_URL, queryParams);
}

/**
 * Fetch an NVA search URL directly (used for cursor-based pagination).
 * The URL is typically the `nextSearchAfterResults` value from a previous response.
 */
export function fetchNvaSearchUrl(url: string): NvaSearchResponse | undefined {
  return fetchNvaSearch(url);
}

function fetchNvaSearch(url: string, params?: Record<string, string>): NvaSearchResponse | undefined {
  try {
    const res = httpRequest({
      url,
      method: "GET",
      params: params,
      connectionTimeout: HTTP_TIMEOUT,
      readTimeout: HTTP_TIMEOUT,
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 200 && res.body) {
      return JSON.parse(res.body) as NvaSearchResponse;
    }

    log.warning(`NVA search returned status ${res.status}: ${res.message ?? ""}`);
    return undefined;
  } catch (e) {
    log.error(`NVA search request failed: ${e}`);
    return undefined;
  }
}

export function getPerson(cristinId: string): NVAPerson | undefined {
  try {
    const res = httpRequest({
      url: `https://api.nva.unit.no/cristin/person/${cristinId}`,
      method: "GET",
      connectionTimeout: HTTP_TIMEOUT,
      readTimeout: HTTP_TIMEOUT,
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 200 && res.body) {
      return JSON.parse(res.body) as NVAPerson;
    }

    log.warning(`NVA search returned status ${res.status}: ${res.message ?? ""}`);
    return undefined;
  } catch (e) {
    log.error(`NVA search request failed: ${e}`);
    return undefined;
  }
}

export type SearchPersonParams = {
  name?: string;
  organization?: string;
  page: string;
  results: string;
};

export type SearchPersonResult = {
  count: number;
  total: number;
  hits: NVAPerson[];
};

export function searchPerson(params: SearchPersonParams): SearchPersonResult {
  try {
    const res = httpRequest({
      url: `https://api.nva.unit.no/cristin/person`,
      method: "GET",
      params,
      connectionTimeout: HTTP_TIMEOUT,
      readTimeout: HTTP_TIMEOUT,
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 200 && res.body) {
      const searchResponse = JSON.parse(res.body) as NVAPersonSearch;

      return {
        count: searchResponse.hits.length,
        total: searchResponse.size,
        hits: searchResponse.hits,
      };
    }

    log.warning(`NVA search returned status ${res.status}: ${res.message ?? ""}`);
  } catch (e) {
    log.error(`NVA search request failed: ${e}`);
  }

  return {
    count: 0,
    total: 0,
    hits: [],
  };
}

export function getOrganization(identifier: string, depth?: "none"): NVAOrganization | undefined {
  try {
    const res = httpRequest({
      url: `https://api.nva.unit.no/cristin/organization/${identifier}`,
      method: "GET",
      params: {
        depth,
      },
      connectionTimeout: HTTP_TIMEOUT,
      readTimeout: HTTP_TIMEOUT,
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 200 && res.body) {
      return JSON.parse(res.body) as NVAOrganization;
    }

    log.warning(`NVA organization returned status ${res.status}: ${res.message ?? ""}`);
  } catch (e) {
    log.error(`NVA search request failed: ${e}`);
  }

  return undefined;
}

export type NVAOrganization = {
  "@context": "https://bibsysdev.github.io/src/organization-context.json";
  type: "Organization";
  id: string;
  labels: Record<"nb" | "en" | "nn", string | undefined>;
  acronym: string;
  country: string;
  partOf: NVAOrganization[];
  hasPart: NVAOrganization[];
};
