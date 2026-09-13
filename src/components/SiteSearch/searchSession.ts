/**
 * Combobox session event. Follow includes activating the already-open path.
 */
export type SearchSessionEvent =
  | { type: "Escape" }
  | { type: "follow"; href: string; pathname: string; hash: string };

/**
 * Clear the finder after Escape or after following a hit.
 * Same-route follow still clears so leftover hits cannot keep aria-current=page.
 *
 * @param query - Current finder query
 * @param event - Escape, or follow with the hit href and the open path
 * @returns Empty query so the result list is gone
 */
export function searchSessionQueryAfter(
  query: string,
  event: SearchSessionEvent,
): string {
  if (event.type === "Escape" || event.type === "follow") {
    return "";
  }
  return query;
}
