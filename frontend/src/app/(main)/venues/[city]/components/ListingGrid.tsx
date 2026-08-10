"use client";

import { Workspace } from "../data/workspaces";
import ListingCard from "./ListingCard";

interface ListingGridProps {
  workspaces: Workspace[];
  city?: string;
  onGetQuote: (workspace: Workspace) => void;
  columns?: "default" | "split" | "stack";
  highlightedId?: string | null;
  onHover?: (id: string | null) => void;
}

export default function ListingGrid({
  workspaces,
  city,
  onGetQuote,
  columns = "default",
  highlightedId = null,
  onHover,
}: ListingGridProps) {
  if (workspaces.length === 0) return null;

  const gridClass =
    columns === "stack"
      ? "grid grid-cols-1 gap-4"
      : columns === "split"
        ? "grid grid-cols-1 xl:grid-cols-2 gap-4"
        : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6";

  return (
    <div className={gridClass}>
      {workspaces.map((workspace) => (
        <ListingCard
          key={workspace.id}
          workspace={workspace}
          city={city}
          onGetQuote={onGetQuote}
          highlighted={highlightedId === workspace.id}
          onHover={onHover}
        />
      ))}
    </div>
  );
}
