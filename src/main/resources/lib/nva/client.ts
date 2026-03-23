import { request as httpRequest } from "/lib/http-client";
import {
  NVA_SEARCH_URL,
  DEFAULT_PAGE_SIZE,
  HTTP_TIMEOUT,
} from "./constants";
import type { NvaSearchParams, NvaSearchResponse } from "./types";

/**
 * Calls the NVA public search API (/search/resources).
 * Returns the parsed response or undefined on error.
 */
export function searchNvaResults(
  params: NvaSearchParams
): NvaSearchResponse | undefined {
  const queryParams: Record<string, string> = {};

  if (params.query) queryParams.query = params.query;
  if (params.title) queryParams.title = params.title;
  if (params.institution) queryParams.institution = params.institution;
  if (params.top_level_organization)
    queryParams.top_level_organization = params.top_level_organization;
  if (params.contributor) queryParams.contributor = params.contributor;
  if (params.contributor_name)
    queryParams.contributor_name = params.contributor_name;
  if (params.category) queryParams.category = params.category;
  if (params.doi) queryParams.doi = params.doi;
  if (params.issn) queryParams.issn = params.issn;
  if (params.isbn) queryParams.isbn = params.isbn;
  if (params.funding_source)
    queryParams.funding_source = params.funding_source;
  if (params.funding_identifier)
    queryParams.funding_identifier = params.funding_identifier;
  if (params.publication_year)
    queryParams.publication_year = params.publication_year;
  if (params.publication_year_since)
    queryParams.publication_year_since = params.publication_year_since;
  if (params.publication_year_before)
    queryParams.publication_year_before = params.publication_year_before;
  if (params.published_since)
    queryParams.published_since = params.published_since;
  if (params.published_before)
    queryParams.published_before = params.published_before;
  if (params.modified_since)
    queryParams.modified_since = params.modified_since;
  if (params.cristin_identifier)
    queryParams.cristin_identifier = params.cristin_identifier;
  if (params.unit) queryParams.unit = params.unit;
  if (params.sort) queryParams.sort = params.sort;
  if (params.order) queryParams.order = params.order;

  queryParams.page = String(params.page ?? 0);
  queryParams.per_page = String(params.size ?? DEFAULT_PAGE_SIZE);

  try {
    const res = httpRequest({
      url: NVA_SEARCH_URL,
      method: "GET",
      params: queryParams,
      connectionTimeout: HTTP_TIMEOUT,
      readTimeout: HTTP_TIMEOUT,
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 200 && res.body) {
      return JSON.parse(res.body) as NvaSearchResponse;
    }

    log.warning(
      `NVA search returned status ${res.status}: ${res.message ?? ""}`
    );
    return undefined;
  } catch (e) {
    log.error(`NVA search request failed: ${e}`);
    return undefined;
  }
}
