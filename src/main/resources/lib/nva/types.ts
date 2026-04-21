// NVA Search API response types based on the OpenAPI spec

export type NvaSearchResponse = {
  id: string;
  totalHits: number;
  nextResults?: string;
  nextSearchAfterResults?: string;
  previousResults?: string;
  hits: NvaResult[];
  aggregations?: Record<string, NvaFacet[]>;
  "@context"?: string;
};

export type NvaFacet = {
  key: string;
  count: number;
  labels: Record<string, string>;
};

export type NvaFunding = {
  identifier?: string;
  source?: string | { identifier?: string; labels?: Record<string, string> };
};

export type NvaResult = {
  [key: string]: unknown;
  id: string;
  type: string;
  otherIdentifiers?: NvaOtherIdentifiers;
  recordMetadata?: NvaRecordMetadata;
  mainTitle?: string;
  abstract?: string;
  description?: string;
  alternativeTitles?: Record<string, string>;
  publicationDate?: NvaPublicationDate;
  contributorsPreview?: NvaContributorPreview[];
  contributorsCount?: number;
  publishingDetails?: NvaPublishingDetails;
  fundings?: NvaFunding[];
  entityDescription?: {
    mainTitle?: string;
    publicationDate?: NvaPublicationDate;
    contributorsPreview?: NvaContributorPreview[];
    abstract?: string;
    reference?: {
      doi?: string;
      publicationContext?: { name?: string; title?: string };
      publicationInstance?: { type?: string };
    };
  };
};

export type NvaOtherIdentifiers = {
  scopus?: string[];
  cristin?: string[];
  handle?: string[];
  issn?: string[];
  isbn?: string[];
};

export type NvaRecordMetadata = {
  status?: string;
  createdDate?: string;
  modifiedDate?: string;
  publishedDate?: string;
};

export type NvaPublicationDate = {
  year?: string;
  month?: string;
  day?: string;
};

export type NvaContributorPreview = {
  affiliations?: NvaAffiliation[];
  correspondingAuthor?: boolean;
  identity?: NvaIdentity;
  role?: string;
  sequence?: number;
};

export type NvaAffiliation = {
  id?: string;
  type?: string;
};

export type NvaIdentity = {
  id?: string;
  name?: string;
};

export type NvaPublishingDetails = {
  id?: string;
  type?: string;
  series?: NvaPublishingSeries;
  publisher?: NvaPublisher;
  name?: string;
  doi?: string;
};

export type NvaPublishingSeries = {
  id?: string;
  name?: string;
  scientificValue?: string;
};

export type NvaPublisher = {
  id?: string;
  name?: string;
  scientificValue?: string;
};

// Search parameters for the NVA /search/resources endpoint
export type NvaSearchParams = {
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
};

// Node structure stored in the XP repo
export type NvaResultNode = {
  _name: string;
  data: NvaResult;
  type: string;
};
