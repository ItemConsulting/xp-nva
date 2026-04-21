import type { Request, Response } from "@enonic-types/core";
import { REPO_NVA_RESULTS, NODE_TYPE_NVA_RESULT } from "/lib/nva";
import { connectToRepoAsAdmin } from "/lib/nva/contexts";
import type {
  CustomSelectorServiceParams,
  CustomSelectorServiceResponseBody,
} from "@item-enonic-types/global/controller";

/**
 * Custom selector service for picking NVA result categories (publication instance types)
 * in Content Studio. Returns unique category types like "AcademicArticle", "AcademicMonograph", etc.
 */
export function get(
  req: Request<{ params: CustomSelectorServiceParams }>,
): Response<{ body: CustomSelectorServiceResponseBody }> {
  const query = (req.params?.query ?? "").trim().toLowerCase();
  const ids = req.params?.ids;

  if (ids) {
    const idList = ids.split(",").map((id) => id.trim());
    const hits = idList.map((id) => ({
      id,
      displayName: humanizeCategory(id),
      description: id,
    }));
    return jsonResponse({ total: hits.length, count: hits.length, hits });
  }

  return listCategories(query);
}

function listCategories(query: string): Response<{ body: CustomSelectorServiceResponseBody }> {
  const conn = connectToRepoAsAdmin(REPO_NVA_RESULTS);

  // Fetch a batch of results to extract unique categories
  const result = conn.query({
    query: `type = '${NODE_TYPE_NVA_RESULT}'`,
    count: 0,
    aggregations: {
      categories: {
        terms: {
          field: "data.entityDescription.reference.publicationInstance.type",
          size: 100,
        },
      },
    },
  });

  const buckets = result.aggregations?.categories?.buckets ?? [];
  let hits = buckets.map((bucket) => ({
    id: bucket.key,
    displayName: humanizeCategory(bucket.key),
    description: `${bucket.docCount} publications`,
  }));

  if (query) {
    hits = hits.filter(
      (h) => h.displayName.toLowerCase().indexOf(query) !== -1 || h.id.toLowerCase().indexOf(query) !== -1,
    );
  }

  hits.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return jsonResponse({ total: hits.length, count: hits.length, hits });
}

const CATEGORY_LABELS: Record<string, string> = {
  AcademicArticle: "Academic Article",
  AcademicMonograph: "Academic Monograph",
  AcademicChapter: "Academic Chapter",
  AcademicLiteratureReview: "Academic Literature Review",
  ProfessionalArticle: "Professional Article",
  PopularScienceArticle: "Popular Science Article",
  ReportResearch: "Research Report",
  ReportWorkingPaper: "Working Paper",
  ConferencePoster: "Conference Poster",
  ConferenceLecture: "Conference Lecture",
  OtherPresentation: "Other Presentation",
  Anthology: "Anthology",
  BookMonograph: "Book Monograph",
  DataManagementPlan: "Data Management Plan",
  DataSet: "Data Set",
};

function humanizeCategory(type: string): string {
  if (CATEGORY_LABELS[type]) return CATEGORY_LABELS[type];
  // Split camelCase to words
  return type.replace(/([A-Z])/g, " $1").trim();
}

function jsonResponse(body: CustomSelectorServiceResponseBody): Response<{ body: CustomSelectorServiceResponseBody }> {
  return {
    status: 200,
    contentType: "application/json",
    body,
  };
}
