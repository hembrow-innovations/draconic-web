import { searchHitHref, type SearchEntry } from "../../lib/search";

/**
 * Move combobox selection through visible hits. A no-op key leaves the index still.
 *
 * @param current - Currently selected hit index
 * @param resultCount - Visible hit count
 * @param key - Arrow Down or Arrow Up from the combobox
 * @returns Next selected index
 */
export function nextSearchActiveIndex(
  current: number,
  resultCount: number,
  key: string,
): number {
  if (resultCount === 0) {
    return 0;
  }
  if (key === "ArrowDown") {
    return current + 1 < resultCount ? current + 1 : current;
  }
  if (key === "ArrowUp") {
    return current > 0 ? current - 1 : 0;
  }
  return Math.min(current, resultCount - 1);
}

/**
 * Href activated by Enter on the selected hit, including the first hit at index 0.
 *
 * @param results - Visible hits in list order
 * @param activeIndex - Selected hit index
 * @param query - Current finder query
 * @returns Start path to follow, or undefined when there are no hits
 */
export function searchActivateHref(
  results: readonly SearchEntry[],
  activeIndex: number,
  query: string,
): string | undefined {
  if (results.length === 0) {
    return undefined;
  }
  const hit = results[Math.min(activeIndex, results.length - 1)] ?? results[0];
  return searchHitHref(hit, query);
}

/**
 * Live region copy for hits or No matching pages. Empty query stays silent.
 *
 * @param query - Current finder query
 * @param resultCount - Visible hit count
 * @returns Announcement text
 */
export function searchLiveAnnouncement(query: string, resultCount: number): string {
  if (query.trim() === "") {
    return "";
  }
  if (resultCount === 0) {
    return "No matching pages";
  }
  return `${resultCount} matching pages`;
}
