import { notNullOrUndefined } from "/lib/nva";
import { getFundingSource, listFundingSources } from "/lib/nva/client";
import type { Request, Response } from "@enonic-types/core";
import type {
  CustomSelectorServiceParams,
  CustomSelectorServiceResponseBody,
  CustomSelectorServiceResponseHit,
} from "@item-enonic-types/global/controller";
import type { NVAFundingSource } from "/lib/nva/types";

export function get(
  req: Request<{ params: CustomSelectorServiceParams }>,
): Response<{ body: CustomSelectorServiceResponseBody }> {
  const query = (req.params?.query ?? "").trim();

  // If the query is a number, then use it as ID
  const ids = req.params.ids ?? (/^\d+$/.test(query) ? query : undefined);

  if (ids) {
    const hits = ids.split(",").map(getFundingSource).filter(notNullOrUndefined).map(nvaFundingSourceToHit);

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

  const allFundingSources = listFundingSources();

  return {
    status: 200,
    contentType: "application/json",
    body: {
      count: allFundingSources.length,
      total: allFundingSources.length,
      hits: allFundingSources.map(nvaFundingSourceToHit),
    },
  };
}

function nvaFundingSourceToHit(fundingSource: NVAFundingSource): CustomSelectorServiceResponseHit {
  return {
    id: fundingSource.identifier,
    displayName: fundingSource.name.nb ?? fundingSource.name.nn ?? fundingSource.name.en ?? "",
    description: fundingSource.identifier,
  };
}
