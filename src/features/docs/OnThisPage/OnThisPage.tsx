import { useEffect, useState } from "react";
import { extractPageOutline } from "../../../lib/content";
import { headingIdInView } from "./headingIdInView";
import type { OnThisPageProps } from "./OnThisPage.types";
import {
  onThisPageItemVariants,
  onThisPageKickerVariants,
  onThisPageLinkVariants,
  onThisPageListVariants,
  onThisPageVariants,
} from "./OnThisPage.variants";

const currentHeading = { "aria-current": "true" as const };

/**
 * In-article list of section headings that link to heading fragment ids.
 *
 * Locks `public-site.chrome:on-page-toc`. Hidden when the body has no section headings.
 * The heading in the viewport is marked; sibling outline links stay unmarked. Side nav keeps page.
 *
 * @param props - Teaching markdown body plus native nav attributes
 * @returns Outline nav, or null when there are no section headings
 */
export function OnThisPage({ className, body, ...props }: OnThisPageProps) {
  const items = extractPageOutline(body);
  const [currentId, setCurrentId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = extractPageOutline(body);
    if (headings.length === 0) {
      return;
    }

    const update = () => {
      const boxes = headings.flatMap((item) => {
        const el = document.getElementById(item.id);
        if (el === null) {
          return [];
        }
        return [{ id: item.id, top: el.getBoundingClientRect().top }];
      });
      const next = headingIdInView(boxes, window.innerHeight);
      if (next !== undefined) {
        setCurrentId(next);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [body]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="On this page"
      className={onThisPageVariants({ className })}
      {...props}
    >
      <p className={onThisPageKickerVariants()}>On this page</p>
      <ol className={onThisPageListVariants()}>
        {items.map((item) => (
          <li
            key={item.id}
            className={onThisPageItemVariants({
              level: item.level === 3 ? "sub" : "section",
            })}
          >
            <a
              href={`#${item.id}`}
              className={onThisPageLinkVariants()}
              {...(item.id === currentId ? currentHeading : {})}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
