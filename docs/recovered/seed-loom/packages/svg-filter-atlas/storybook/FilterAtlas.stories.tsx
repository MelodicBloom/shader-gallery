import type { Meta, StoryObj } from "@storybook/react";
import { FilterDefinitions, filterUrl } from "../src/react";
import { recipes } from "../src/catalog";

function Gallery() {
  const include = recipes.flatMap((recipe) => Object.keys(recipe.presets).map((preset) => ({ recipe: recipe.id, preset })));
  return <>
    <FilterDefinitions include={include} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
      {include.map(({ recipe, preset }) => <article key={`${recipe}-${preset}`} style={{ minHeight: 180, padding: 24, borderRadius: 18, background: "linear-gradient(135deg,#4b617d,#d4b4cb,#d7ebdf)", filter: filterUrl(recipe, preset) }}>
        <strong>{recipe}</strong><br />{preset}
      </article>)}
    </div>
  </>;
}

const meta = { title: "SVG Filter Atlas/All Presets", component: Gallery } satisfies Meta<typeof Gallery>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllPresets: Story = {};
