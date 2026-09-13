import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "../components/NotFound";

export const Route = createFileRoute("/404")({
  component: NotFoundPage,
});

/**
 * Prerendered custom 404 page for GitHub Pages.
 *
 * Locks `public-site.chrome:not-found`. Unknown URLs keep skip-link, side nav,
 * and footer because Pages serves this file instead of a host miss.
 */
function NotFoundPage() {
  return <NotFound />;
}
