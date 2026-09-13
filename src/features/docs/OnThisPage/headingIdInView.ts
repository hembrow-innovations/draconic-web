/**
 * One section heading's position relative to the viewport top.
 */
export type HeadingViewportBox = {
  /** Heading fragment id that matches the outline link. */
  id: string;
  /** `getBoundingClientRect().top` for that heading. */
  top: number;
};

/**
 * Pick the outline id whose heading is in the viewport, ignoring URL hash.
 *
 * Empty hash and scroll use the same rule: the topmost heading whose top sits
 * in the viewport, else the last heading already above it.
 *
 * @param headings - Heading ids with viewport tops, in document order
 * @param viewportHeight - `window.innerHeight`
 * @returns Current outline id, or undefined when there are no headings
 */
export function headingIdInView(
  headings: HeadingViewportBox[],
  viewportHeight: number,
): string | undefined {
  if (headings.length === 0) {
    return undefined;
  }
  const inView = headings.filter((heading) => heading.top >= 0 && heading.top < viewportHeight);
  if (inView.length > 0) {
    return inView[0].id;
  }
  const above = headings.filter((heading) => heading.top < 0);
  if (above.length > 0) {
    return above[above.length - 1].id;
  }
  return headings[0].id;
}
