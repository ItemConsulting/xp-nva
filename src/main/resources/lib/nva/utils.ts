import type { NvaResult } from "./types";

/**
 * Filter out null/undefined values from arrays.
 */
export function notNullOrUndefined<T>(val: T | null | undefined): val is T {
  return val !== null && val !== undefined;
}

/**
 * Normalize a value to an array.
 */
export function forceArray<T>(data: T | T[] | undefined | null): T[] {
  if (data === undefined || data === null) return [];
  return Array.isArray(data) ? data : [data];
}

/**
 * Extract the UUID from an NVA URI like https://api.nva.unit.no/publication/<uuid>
 */
export function extractUuidFromUri(uri: string): string {
  const parts = uri.split("/");
  return parts[parts.length - 1];
}

/**
 * Get a display title for an NVA result, with fallback.
 */
export function getResultTitle(result: NvaResult): string {
  return result.entityDescription?.mainTitle ?? result.mainTitle ?? "Untitled";
}

/**
 * Get the first Cristin ID from a result's otherIdentifiers, if present.
 */
export function getCristinId(result: NvaResult): string | undefined {
  const cristinIds = result.otherIdentifiers?.cristin;
  return cristinIds && cristinIds.length > 0 ? cristinIds[0] : undefined;
}

/**
 * Get the publication year from a result.
 */
export function getPublicationYear(result: NvaResult): string | undefined {
  return result.entityDescription?.publicationDate?.year ?? result.publicationDate?.year;
}

/**
 * Recursively stringify an object with sorted keys for order-independent comparison.
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  return `{${sorted.map((k) => `${JSON.stringify(k)}:${stableStringify((obj as Record<string, unknown>)[k])}`).join(",")}}`;
}
