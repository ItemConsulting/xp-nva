import { notNullOrUndefined } from "/lib/nva";
import { getPerson, searchPerson } from "/lib/nva/client";
import { find } from "/lib/nva/utils";
import { getOrganizationIdByAffiliation, getOrganizationName } from "/lib/nva/organizations";
import type { Request, Response } from "@enonic-types/core";
import type {
  CustomSelectorServiceParams,
  CustomSelectorServiceResponseBody,
  CustomSelectorServiceResponseHit,
} from "@item-enonic-types/global/controller";
import { NVAPerson } from "/lib/nva/types";

/**
 * Custom selector service for picking NVA contributors (persons) in Content Studio.
 * Returns Cristin person IDs as values, with contributor names as display names.
 */
export function get(
  req: Request<{ params: CustomSelectorServiceParams }>,
): Response<{ body: CustomSelectorServiceResponseBody }> {
  const query = (req.params?.query ?? "").trim();

  // If the query is a number, then use it as ID
  const ids = req.params.ids ?? (/^\d+$/.test(query) ? query : undefined);

  if (ids) {
    const hits = ids.split(",").map(getPerson).filter(notNullOrUndefined).map(nvaPersonToHit);

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

  const start = parseInt(req.params.start ?? "0", 10);
  const count = parseInt(req.params.count ?? "20", 10);
  const page = Math.floor(start / count) + 1;
  const searchResponse = searchPerson(
    query
      ? // if "query" exists – search the whole database
        {
          name: query,
          page: String(page),
          results: String(count),
        }
      : // if no "query" – list only in own institution
        {
          organization: app.config.institution,
          page: String(page),
          results: String(count),
        },
  );

  return {
    status: 200,
    contentType: "application/json",
    body: {
      count: searchResponse.count,
      total: searchResponse.total,
      hits: searchResponse.hits.map(nvaPersonToHit),
    },
  };
}

function nvaPersonToHit(person: NVAPerson): CustomSelectorServiceResponseHit {
  const id = person.identifiers[0].value;

  const name = [
    findByType(person.names, "PreferredLastName")?.value ?? findByType(person.names, "LastName")?.value,
    findByType(person.names, "PreferredFirstName")?.value ?? findByType(person.names, "FirstName")?.value,
  ]
    .filter(notNullOrUndefined)
    .join(", ");

  const affiliations = person.affiliations.filter((affiliation) => affiliation.active);

  // If the current institution is in the list, it should come first
  affiliations.sort((affiliation) =>
    getOrganizationIdByAffiliation(affiliation).indexOf(app.config.institution ?? "") === 0 ? -1 : 0,
  );

  return {
    id,
    displayName: `${name} (${id})`,
    description: affiliations
      .map(getOrganizationIdByAffiliation)
      .map(getOrganizationName)
      .filter(notNullOrUndefined)
      .join(", "),
  };
}

function findByType<T extends { type: string }>(xs: T[], type: T["type"]): T | undefined {
  return find(xs, (x) => x.type === type);
}
