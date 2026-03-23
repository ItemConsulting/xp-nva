// NVA Search API response types based on the OpenAPI spec

export interface NvaSearchResponse {
  id: string;
  totalHits: number;
  nextResults?: string;
  nextSearchAfterResults?: string;
  previousResults?: string;
  hits: Array<NvaResult>;
  aggregations?: Record<string, Array<NvaFacet>>;
  "@context"?: string;
}

export interface NvaFacet {
  key: string;
  count: number;
  labels: Record<string, string>;
}

export interface NvaResult {
  id: string;
  type: string;
  otherIdentifiers?: NvaOtherIdentifiers;
  recordMetadata?: NvaRecordMetadata;
  mainTitle?: string;
  abstract?: string;
  description?: string;
  alternativeTitles?: Record<string, string>;
  publicationDate?: NvaPublicationDate;
  contributorsPreview?: Array<NvaContributorPreview>;
  contributorsCount?: number;
  publishingDetails?: NvaPublishingDetails;
}

export interface NvaOtherIdentifiers {
  scopus?: Array<string>;
  cristin?: Array<string>;
  handle?: Array<string>;
  issn?: Array<string>;
  isbn?: Array<string>;
}

export interface NvaRecordMetadata {
  status?: string;
  createdDate?: string;
  modifiedDate?: string;
  publishedDate?: string;
}

export interface NvaPublicationDate {
  year?: string;
  month?: string;
  day?: string;
}

export interface NvaContributorPreview {
  affiliations?: Array<NvaAffiliation>;
  correspondingAuthor?: boolean;
  identity?: NvaIdentity;
  role?: string;
  sequence?: number;
}

export interface NvaAffiliation {
  id?: string;
  type?: string;
}

export interface NvaIdentity {
  id?: string;
  name?: string;
}

export interface NvaPublishingDetails {
  id?: string;
  type?: string;
  series?: NvaPublishingSeries;
  publisher?: NvaPublisher;
  name?: string;
  doi?: string;
}

export interface NvaPublishingSeries {
  id?: string;
  name?: string;
  scientificValue?: string;
}

export interface NvaPublisher {
  id?: string;
  name?: string;
  scientificValue?: string;
}

// Search parameters for the NVA /search/resources endpoint
export interface NvaSearchParams {
  query?: string;
  title?: string;
  institution?: string;
  top_level_organization?: string;
  contributor?: string;
  contributor_name?: string;
  category?: string;
  doi?: string;
  issn?: string;
  isbn?: string;
  funding_source?: string;
  funding_identifier?: string;
  publication_year?: string;
  publication_year_since?: string;
  publication_year_before?: string;
  published_since?: string;
  published_before?: string;
  modified_since?: string;
  cristin_identifier?: string;
  unit?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  size?: number;
}

// Node structure stored in the XP repo
export interface NvaResultNode {
  _name: string;
  data: NvaResult;
  type: string;
  removedFromNva?: boolean;
}
