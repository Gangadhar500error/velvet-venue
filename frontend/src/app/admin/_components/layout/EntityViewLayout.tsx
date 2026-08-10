"use client";

import type { ReactNode } from "react";

/**
 * Sticky overview sidebar for entity view pages.
 * Sticks within the detail grid until cross-reference sections begin (full width below).
 */
export const entityViewOverviewAsideClass =
  "xl:col-span-4 min-w-0 xl:sticky xl:top-3 xl:z-[2] xl:self-start";

interface EntityViewLayoutProps {
  /** Left column: identity, forms, and detail sections */
  main: ReactNode;
  /** Right column: overview / summary card (sticky on xl+) */
  overview?: ReactNode;
  /** Full-width blocks below the two-column region (RelationCard tables, etc.) */
  crossReference?: ReactNode;
  /** Hide the overview column (e.g. narrow-only layouts still stack on mobile) */
  hideOverview?: boolean;
}

/**
 * Standard entity view layout:
 * - Two columns (8/4) for details + sticky overview
 * - Full-width cross-reference region after the grid (no right column)
 */
export function EntityViewLayout({
  main,
  overview,
  crossReference,
  hideOverview = false,
}: EntityViewLayoutProps) {
  const showOverview = !hideOverview && overview;

  return (
    <div className="space-y-3">
      {showOverview ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
          <div className="xl:col-span-8 min-w-0">{main}</div>
          <aside className={entityViewOverviewAsideClass}>{overview}</aside>
        </div>
      ) : (
        <div className="min-w-0 w-full">{main}</div>
      )}

      {crossReference ? (
        <div className="min-w-0 w-full space-y-3">{crossReference}</div>
      ) : null}
    </div>
  );
}
