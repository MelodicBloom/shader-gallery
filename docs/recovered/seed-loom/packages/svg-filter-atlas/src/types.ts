export type FilterFamily =
  | "optical"
  | "tactile"
  | "pattern"
  | "structural"
  | "living"
  | "fluid"
  | "chromatic"
  | "animated";

export type RecipeStatus = "draft" | "approved" | "deprecated" | "experimental";
export type ParameterValue = string | number | boolean;

export interface FilterRegion {
  x: string;
  y: string;
  width: string;
  height: string;
}

export interface PrimitiveNode {
  id: string;
  type: string;
  attributes: Record<string, ParameterValue>;
  children?: PrimitiveNode[];
}

export interface ParameterBinding {
  primitiveId: string;
  attribute: string;
  component?: number;
}

export interface FilterParameter {
  key: string;
  label: string;
  type: "number" | "integer" | "color" | "select" | "boolean";
  default: ParameterValue;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
  binding: ParameterBinding;
}

export interface FilterPreset {
  name: string;
  description: string;
  values: Record<string, ParameterValue>;
}

export interface FilterRecipe {
  $schema?: string;
  id: string;
  name: string;
  version: string;
  status: RecipeStatus;
  family: FilterFamily;
  intent: string[];
  tags: string[];
  filterRegion: FilterRegion;
  colorInterpolation: "sRGB" | "linearRGB";
  primitives: PrimitiveNode[];
  parameters: FilterParameter[];
  presets: Record<string, FilterPreset>;
  performance: {
    tier: "light" | "moderate" | "heavy" | "experimental";
    animated: boolean;
    primitiveCount: number;
    recommendedMaxInstances: number;
    recommendedMaxAreaPx: number;
  };
  accessibility: {
    decorative: boolean;
    reducedMotionFallback: string | null;
    notes: string;
  };
  governance: {
    recommendedUses: string[];
    avoid: string[];
  };
  source?: Record<string, string>;
}

export interface CompileOptions {
  preset?: string;
  parameters?: Record<string, ParameterValue>;
  id?: string;
  prefix?: string;
  includePrimitiveIds?: boolean;
}

export interface FilterSelection {
  recipe: string;
  preset?: string;
  parameters?: Record<string, ParameterValue>;
  id?: string;
}
