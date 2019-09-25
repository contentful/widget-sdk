/**
 * Parse a string with the Javascript Date constructor and return an
 * ISO 8601 formatted representation
 */
export function dateStringToIso(string) {
  if (string) {
    return new Date(string).toISOString();
  }
}
