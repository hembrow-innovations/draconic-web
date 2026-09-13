import { useEffect, useId, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  querySearchIndex,
  searchHitHref,
  searchHitLabel,
  useSearchIndex,
} from "../../lib/search";
import {
  nextSearchActiveIndex,
  searchActivateHref,
  searchLiveAnnouncement,
} from "./searchCombobox";
import { searchSessionQueryAfter } from "./searchSession";
import type { SiteSearchProps } from "./SiteSearch.types";
import {
  siteSearchEmptyVariants,
  siteSearchInputVariants,
  siteSearchLinkVariants,
  siteSearchLiveVariants,
  siteSearchResultsVariants,
  siteSearchVariants,
} from "./SiteSearch.variants";

/**
 * Client finder for Learn and Reference titles, headings, and teaching-page body.
 *
 * Locks `public-site.search:titles-headings`, `public-site.search:session`,
 * and `public-site.search:keyboard-live`.
 *
 * @param props - Native element attributes
 * @returns Search field and result links
 */
export function SiteSearch({ className, ...props }: SiteSearchProps) {
  const index = useSearchIndex();
  const location = useLocation();
  const navigate = useNavigate();
  const searchId = useId();
  const listId = `${searchId}-results`;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const results = querySearchIndex(index, query);
  const miss = query.trim() !== "" && results.length === 0;
  const expanded = results.length > 0;
  const clampedIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);
  const activeOptionId =
    results.length > 0 ? `${searchId}-hit-${clampedIndex}` : undefined;

  useEffect(() => {
    setQuery("");
  }, [location.pathname, location.hash]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  return (
    <div className={siteSearchVariants({ className })} {...props}>
      <input
        type="search"
        role="combobox"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery(searchSessionQueryAfter(query, { type: "Escape" }));
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            if (results.length === 0) {
              return;
            }
            event.preventDefault();
            setActiveIndex((current) =>
              nextSearchActiveIndex(current, results.length, event.key),
            );
            return;
          }
          if (event.key === "Enter") {
            const href = searchActivateHref(results, clampedIndex, query);
            if (href === undefined) {
              return;
            }
            event.preventDefault();
            const hashAt = href.indexOf("#");
            const to = hashAt === -1 ? href : href.slice(0, hashAt);
            const hash = hashAt === -1 ? undefined : href.slice(hashAt + 1);
            setQuery(
              searchSessionQueryAfter(query, {
                type: "follow",
                href,
                pathname: location.pathname,
                hash: location.hash.replace(/^#/, ""),
              }),
            );
            void navigate({ to, hash });
          }
        }}
        aria-label="Search"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={results.length > 0 ? listId : undefined}
        aria-activedescendant={activeOptionId}
        className={siteSearchInputVariants()}
      />
      <p className={siteSearchLiveVariants()} aria-live="polite">
        {searchLiveAnnouncement(query, results.length)}
      </p>
      {results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className={siteSearchResultsVariants()}
        >
          {results.map((entry, index) => {
            const href = searchHitHref(entry, query);
            const hashAt = href.indexOf("#");
            const to = hashAt === -1 ? href : href.slice(0, hashAt);
            const hash = hashAt === -1 ? undefined : href.slice(hashAt + 1);
            const selected = index === clampedIndex;
            return (
              <li
                key={entry.href}
                id={`${searchId}-hit-${index}`}
                role="option"
                aria-selected={selected}
              >
                <Link
                  to={to}
                  hash={hash}
                  tabIndex={-1}
                  className={siteSearchLinkVariants({ selected })}
                  onClick={() =>
                    setQuery(
                      searchSessionQueryAfter(query, {
                        type: "follow",
                        href,
                        pathname: location.pathname,
                        hash: location.hash.replace(/^#/, ""),
                      }),
                    )
                  }
                >
                  {searchHitLabel(entry, query)}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : miss ? (
        <p className={siteSearchEmptyVariants()}>No matching pages</p>
      ) : null}
    </div>
  );
}
