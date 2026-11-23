import { FilterDefinitions, filterUrl } from "@melodicbloom/svg-filter-atlas/react";

export function ArtworkCard() {
  return (
    <>
      <FilterDefinitions include={[
        { recipe: "nacre-laminate", preset: "abalone-ridge" },
        { recipe: "brass-inlay", preset: "polished-inlay" },
      ]} />
      <article style={{ filter: filterUrl("nacre-laminate", "abalone-ridge") }}>
        Approved material treatment
      </article>
    </>
  );
}
