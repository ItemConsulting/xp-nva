import { notNullOrUndefined } from "/lib/nva";
import { getVerifiedFunding, listVerifiedFunding } from "/lib/nva/client";
import type { Request, Response } from "@enonic-types/core";
import type {
  CustomSelectorServiceParams,
  CustomSelectorServiceResponseBody,
  CustomSelectorServiceResponseHit,
} from "@item-enonic-types/global/controller";
import type { NVAVerifiedFunding } from "/lib/nva/types";

export function get(
  req: Request<{ params: CustomSelectorServiceParams }>,
): Response<{ body: CustomSelectorServiceResponseBody }> {
  const query = (req.params?.query ?? "").trim();

  // If the query is a number, then use it as ID
  const ids = req.params.ids ?? (/^\d+$/.test(query) ? query : undefined);

  if (ids) {
    const hits = ids.split(",").map(getVerifiedFunding).filter(notNullOrUndefined).map(nvaVerifiedFundingToHit);

    return {
      status: 200,
      contentType: "application/json",
      body: {
        count: hits.length,
        total: hits.length,
        hits,
      },
    };
  }

  const allFundings = listVerifiedFunding(req.params.query, req.params.start, req.params.count);

  return {
    status: 200,
    contentType: "application/json",
    body: {
      count: allFundings.length,
      total: allFundings.length,
      hits: allFundings.map(nvaVerifiedFundingToHit),
    },
  };
}

function nvaVerifiedFundingToHit(verifiedFunding: NVAVerifiedFunding): CustomSelectorServiceResponseHit {
  return {
    id: verifiedFunding.identifier,
    displayName: verifiedFunding.labels.nb ?? verifiedFunding.labels.nn ?? verifiedFunding.labels.en ?? "",
    description: verifiedFunding.identifier,
  };
}
