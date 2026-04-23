/**
 * Returns the substring after the first occurrence of `separator`.
 * Returns an empty string if `separator` is not found.
 */
export function getSubstringAfter(str: string, separator: string): string {
  const index = str.indexOf(separator);
  if (index === -1) return "";
  return str.substring(index + separator.length);
}

/**
 * Returns the substring after the last occurrence of `separator`.
 * Returns an empty string if `separator` is not found.
 */
export function getSubstringAfterLast(str: string, separator: string): string {
  const index = str.lastIndexOf(separator);
  if (index === -1) return "";
  return str.substring(index + separator.length);
}
