const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ids from URLs, forms and cookies are untrusted; check them before they reach a uuid column.
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
