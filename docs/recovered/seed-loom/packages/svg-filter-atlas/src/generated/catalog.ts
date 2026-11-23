// Generated from recipes/*.json. Do not edit directly.
export const recipeCatalog = [
  {
    "$schema": "../../schema/svg-filter-recipe.schema.json",
    "id": "brass-inlay",
    "name": "Brass Inlay Edge",
    "version": "0.1.0",
    "status": "approved",
    "family": "structural",
    "intent": [
      "metallic inset outline",
      "carved border",
      "polished edge"
    ],
    "tags": [
      "brass",
      "morphology",
      "metal",
      "outline",
      "inlay"
    ],
    "filterRegion": {
      "x": "-20%",
      "y": "-20%",
      "width": "140%",
      "height": "140%"
    },
    "colorInterpolation": "sRGB",
    "primitives": [
      {
        "id": "brass-outer",
        "type": "feMorphology",
        "attributes": {
          "in": "SourceAlpha",
          "operator": "dilate",
          "radius": 3,
          "result": "outer"
        }
      },
      {
        "id": "brass-inner",
        "type": "feMorphology",
        "attributes": {
          "in": "SourceAlpha",
          "operator": "erode",
          "radius": 1,
          "result": "inner"
        }
      },
      {
        "id": "brass-ring",
        "type": "feComposite",
        "attributes": {
          "in": "outer",
          "in2": "inner",
          "operator": "xor",
          "result": "ring"
        }
      },
      {
        "id": "brass-flood",
        "type": "feFlood",
        "attributes": {
          "flood-color": "#d2a84a",
          "result": "gold"
        }
      },
      {
        "id": "brass-inlay",
        "type": "feComposite",
        "attributes": {
          "in": "gold",
          "in2": "ring",
          "operator": "in",
          "result": "inlay"
        }
      },
      {
        "id": "brass-soft",
        "type": "feGaussianBlur",
        "attributes": {
          "in": "ring",
          "stdDeviation": 1.2,
          "result": "softRing"
        }
      },
      {
        "id": "brass-light",
        "type": "feSpecularLighting",
        "attributes": {
          "in": "softRing",
          "surfaceScale": 3,
          "specularConstant": 1.4,
          "specularExponent": 20,
          "lighting-color": "#fff2bd",
          "result": "shine"
        },
        "children": [
          {
            "id": "brass-dl",
            "type": "feDistantLight",
            "attributes": {
              "azimuth": 225,
              "elevation": 60
            }
          }
        ]
      },
      {
        "id": "brass-shine-ring",
        "type": "feComposite",
        "attributes": {
          "in": "shine",
          "in2": "ring",
          "operator": "in",
          "result": "shineRing"
        }
      },
      {
        "id": "brass-merge",
        "type": "feMerge",
        "attributes": {},
        "children": [
          {
            "id": "brass-node-inlay",
            "type": "feMergeNode",
            "attributes": {
              "in": "inlay"
            }
          },
          {
            "id": "brass-node-shine",
            "type": "feMergeNode",
            "attributes": {
              "in": "shineRing"
            }
          },
          {
            "id": "brass-node-source",
            "type": "feMergeNode",
            "attributes": {
              "in": "SourceGraphic"
            }
          }
        ]
      }
    ],
    "parameters": [
      {
        "key": "outer-radius",
        "label": "Outer Radius",
        "type": "number",
        "default": 3,
        "binding": {
          "primitiveId": "brass-outer",
          "attribute": "radius"
        },
        "min": 0.5,
        "max": 9,
        "step": 0.5
      },
      {
        "key": "inner-radius",
        "label": "Inner Radius",
        "type": "number",
        "default": 1,
        "binding": {
          "primitiveId": "brass-inner",
          "attribute": "radius"
        },
        "min": 0,
        "max": 5,
        "step": 0.5
      },
      {
        "key": "brass-color",
        "label": "Brass Color",
        "type": "color",
        "default": "#d2a84a",
        "binding": {
          "primitiveId": "brass-flood",
          "attribute": "flood-color"
        }
      },
      {
        "key": "specular-constant",
        "label": "Specular Constant",
        "type": "number",
        "default": 1.4,
        "binding": {
          "primitiveId": "brass-light",
          "attribute": "specularConstant"
        },
        "min": 0.1,
        "max": 3,
        "step": 0.1
      }
    ],
    "presets": {
      "soft-patina": {
        "name": "Soft Patina",
        "description": "Muted warm outline with restrained highlight.",
        "values": {
          "outer-radius": 2.5,
          "inner-radius": 1.5,
          "brass-color": "#a88752",
          "specular-constant": 0.7
        }
      },
      "polished-inlay": {
        "name": "Polished Inlay",
        "description": "Bright precise metallic edge for premium controls.",
        "values": {
          "outer-radius": 3,
          "inner-radius": 0.5,
          "brass-color": "#e1bd66",
          "specular-constant": 2.2
        }
      },
      "aged-edge": {
        "name": "Aged Edge",
        "description": "Thicker darker architectural inlay.",
        "values": {
          "outer-radius": 5,
          "inner-radius": 2,
          "brass-color": "#8b6a2f",
          "specular-constant": 1.1
        }
      }
    },
    "performance": {
      "tier": "heavy",
      "animated": false,
      "primitiveCount": 9,
      "recommendedMaxInstances": 8,
      "recommendedMaxAreaPx": 500000
    },
    "accessibility": {
      "decorative": true,
      "reducedMotionFallback": null,
      "notes": "Do not apply to essential body text without an unfiltered semantic duplicate."
    },
    "governance": {
      "recommendedUses": [
        "selected controls",
        "artwork frames",
        "premium card borders"
      ],
      "avoid": [
        "dense text",
        "hairline icons",
        "more than one metallic border layer"
      ]
    },
    "source": {
      "origin": "SVG Filter Atelier v2",
      "migration": "v0.1 signature material migration"
    }
  },
  {
    "$schema": "../../schema/svg-filter-recipe.schema.json",
    "id": "guanine-crystal",
    "name": "Guanine Crystal Facets",
    "version": "0.1.0",
    "status": "approved",
    "family": "optical",
    "intent": [
      "iridescent crystal platelets",
      "directional spectral flash",
      "faceted biological optics"
    ],
    "tags": [
      "guanine",
      "crystal",
      "facets",
      "iridescence",
      "flash"
    ],
    "filterRegion": {
      "x": "-10%",
      "y": "-10%",
      "width": "120%",
      "height": "120%"
    },
    "colorInterpolation": "sRGB",
    "primitives": [
      {
        "id": "guanine-turb",
        "type": "feTurbulence",
        "attributes": {
          "type": "turbulence",
          "baseFrequency": "0.075 0.18",
          "numOctaves": 2,
          "seed": 41,
          "result": "facets"
        }
      },
      {
        "id": "guanine-color",
        "type": "feColorMatrix",
        "attributes": {
          "in": "facets",
          "type": "matrix",
          "values": "0.9 0.2 0.4 0 0.05  0.1 0.95 0.2 0 0.08  0.45 0.12 1.1 0 0.18  0 0 0 0.72 0",
          "result": "iridescence"
        }
      },
      {
        "id": "guanine-light",
        "type": "feSpecularLighting",
        "attributes": {
          "in": "facets",
          "surfaceScale": 7,
          "specularConstant": 1.8,
          "specularExponent": 34,
          "lighting-color": "#e7fbff",
          "result": "flash"
        },
        "children": [
          {
            "id": "guanine-point",
            "type": "fePointLight",
            "attributes": {
              "x": 130,
              "y": 70,
              "z": 240
            }
          }
        ]
      },
      {
        "id": "guanine-mask",
        "type": "feComposite",
        "attributes": {
          "in": "flash",
          "in2": "SourceGraphic",
          "operator": "in",
          "result": "flashMask"
        }
      },
      {
        "id": "guanine-crystal",
        "type": "feBlend",
        "attributes": {
          "in": "SourceGraphic",
          "in2": "iridescence",
          "mode": "color-dodge",
          "result": "crystal"
        }
      },
      {
        "id": "guanine-blend",
        "type": "feBlend",
        "attributes": {
          "in": "crystal",
          "in2": "flashMask",
          "mode": "screen"
        }
      }
    ],
    "parameters": [
      {
        "key": "facet-x",
        "label": "Facet X",
        "type": "number",
        "default": 0.075,
        "binding": {
          "primitiveId": "guanine-turb",
          "attribute": "baseFrequency",
          "component": 0
        },
        "min": 0.01,
        "max": 0.25,
        "step": 0.001
      },
      {
        "key": "facet-y",
        "label": "Facet Y",
        "type": "number",
        "default": 0.18,
        "binding": {
          "primitiveId": "guanine-turb",
          "attribute": "baseFrequency",
          "component": 1
        },
        "min": 0.03,
        "max": 0.45,
        "step": 0.01
      },
      {
        "key": "surface-scale",
        "label": "Surface Scale",
        "type": "number",
        "default": 7,
        "binding": {
          "primitiveId": "guanine-light",
          "attribute": "surfaceScale"
        },
        "min": 1,
        "max": 14,
        "step": 0.5
      },
      {
        "key": "specular-exponent",
        "label": "Specular Exponent",
        "type": "number",
        "default": 34,
        "binding": {
          "primitiveId": "guanine-light",
          "attribute": "specularExponent"
        },
        "min": 4,
        "max": 70,
        "step": 2
      },
      {
        "key": "light-x",
        "label": "Light X",
        "type": "number",
        "default": 130,
        "binding": {
          "primitiveId": "guanine-point",
          "attribute": "x"
        },
        "min": 0,
        "max": 400,
        "step": 5
      }
    ],
    "presets": {
      "relaxed-blue": {
        "name": "Relaxed Blue",
        "description": "Close-set cool facets with broad soft highlights.",
        "values": {
          "facet-x": 0.052,
          "facet-y": 0.14,
          "surface-scale": 5,
          "specular-exponent": 24,
          "light-x": 110
        }
      },
      "excited-spectrum": {
        "name": "Excited Spectrum",
        "description": "Expanded facets and sharper spectral flashes.",
        "values": {
          "facet-x": 0.095,
          "facet-y": 0.24,
          "surface-scale": 9,
          "specular-exponent": 48,
          "light-x": 230
        }
      },
      "silver-flash": {
        "name": "Silver Flash",
        "description": "Fine crystalline grain with a concentrated neutral highlight.",
        "values": {
          "facet-x": 0.12,
          "facet-y": 0.32,
          "surface-scale": 11,
          "specular-exponent": 62,
          "light-x": 175
        }
      }
    },
    "performance": {
      "tier": "heavy",
      "animated": false,
      "primitiveCount": 6,
      "recommendedMaxInstances": 3,
      "recommendedMaxAreaPx": 550000
    },
    "accessibility": {
      "decorative": true,
      "reducedMotionFallback": null,
      "notes": "Do not apply to essential body text without an unfiltered semantic duplicate."
    },
    "governance": {
      "recommendedUses": [
        "scientific artwork",
        "small hero accents",
        "spectral interaction feedback"
      ],
      "avoid": [
        "large scrolling backgrounds",
        "long text",
        "combining with chromatic aberration at full strength"
      ]
    },
    "source": {
      "origin": "SVG Filter Atelier v2",
      "migration": "v0.1 signature material migration"
    }
  },
  {
    "$schema": "../../schema/svg-filter-recipe.schema.json",
    "id": "lithographic-grain",
    "name": "Lithographic Grain",
    "version": "0.1.0",
    "status": "approved",
    "family": "pattern",
    "intent": [
      "threshold ink texture",
      "printed plate wear",
      "stippled image field"
    ],
    "tags": [
      "lithographic",
      "threshold",
      "ink",
      "print",
      "grain"
    ],
    "filterRegion": {
      "x": "0%",
      "y": "0%",
      "width": "100%",
      "height": "100%"
    },
    "colorInterpolation": "sRGB",
    "primitives": [
      {
        "id": "litho-turb",
        "type": "feTurbulence",
        "attributes": {
          "type": "fractalNoise",
          "baseFrequency": 0.42,
          "numOctaves": 2,
          "seed": 31,
          "result": "grain"
        }
      },
      {
        "id": "litho-threshold",
        "type": "feColorMatrix",
        "attributes": {
          "in": "grain",
          "type": "matrix",
          "values": "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 16 -7.6",
          "result": "ink"
        }
      },
      {
        "id": "litho-mask",
        "type": "feComposite",
        "attributes": {
          "in": "ink",
          "in2": "SourceGraphic",
          "operator": "in",
          "result": "masked"
        }
      },
      {
        "id": "litho-blend",
        "type": "feBlend",
        "attributes": {
          "in": "SourceGraphic",
          "in2": "masked",
          "mode": "multiply"
        }
      }
    ],
    "parameters": [
      {
        "key": "grain-scale",
        "label": "Grain Scale",
        "type": "number",
        "default": 0.42,
        "binding": {
          "primitiveId": "litho-turb",
          "attribute": "baseFrequency"
        },
        "min": 0.08,
        "max": 0.9,
        "step": 0.02
      },
      {
        "key": "octaves",
        "label": "Octaves",
        "type": "integer",
        "default": 2,
        "binding": {
          "primitiveId": "litho-turb",
          "attribute": "numOctaves"
        },
        "min": 1,
        "max": 4,
        "step": 1
      },
      {
        "key": "threshold-mult",
        "label": "Threshold Multiplier",
        "type": "number",
        "default": 16,
        "binding": {
          "primitiveId": "litho-threshold",
          "attribute": "values",
          "component": 18
        },
        "min": 5,
        "max": 30,
        "step": 1
      },
      {
        "key": "threshold-sub",
        "label": "Threshold Offset",
        "type": "number",
        "default": -7.6,
        "binding": {
          "primitiveId": "litho-threshold",
          "attribute": "values",
          "component": 19
        },
        "min": -15,
        "max": -1,
        "step": 0.2
      }
    ],
    "presets": {
      "clean-stipple": {
        "name": "Clean Stipple",
        "description": "Fine controlled print texture with restrained thresholding.",
        "values": {
          "grain-scale": 0.56,
          "octaves": 1,
          "threshold-mult": 12,
          "threshold-sub": -5.2
        }
      },
      "worn-plate": {
        "name": "Worn Plate",
        "description": "Irregular plate wear with broken ink density.",
        "values": {
          "grain-scale": 0.3,
          "octaves": 3,
          "threshold-mult": 18,
          "threshold-sub": -8.4
        }
      },
      "dense-ink": {
        "name": "Dense Ink",
        "description": "High-coverage black field for poster and title treatments.",
        "values": {
          "grain-scale": 0.68,
          "octaves": 2,
          "threshold-mult": 24,
          "threshold-sub": -10.6
        }
      }
    },
    "performance": {
      "tier": "moderate",
      "animated": false,
      "primitiveCount": 4,
      "recommendedMaxInstances": 12,
      "recommendedMaxAreaPx": 1000000
    },
    "accessibility": {
      "decorative": true,
      "reducedMotionFallback": null,
      "notes": "Do not apply to essential body text without an unfiltered semantic duplicate."
    },
    "governance": {
      "recommendedUses": [
        "poster titles",
        "artwork masks",
        "editorial image treatments"
      ],
      "avoid": [
        "body copy",
        "fine UI controls",
        "simultaneous use with CRT distortion"
      ]
    },
    "source": {
      "origin": "SVG Filter Atelier v2",
      "migration": "v0.1 signature material migration"
    }
  },
  {
    "$schema": "../../schema/svg-filter-recipe.schema.json",
    "id": "marble-vein",
    "name": "Carved Marble Vein",
    "version": "0.1.0",
    "status": "approved",
    "family": "tactile",
    "intent": [
      "stone vein field",
      "carved mineral streak",
      "directional marble warp"
    ],
    "tags": [
      "marble",
      "stone",
      "vein",
      "displacement",
      "carved"
    ],
    "filterRegion": {
      "x": "-8%",
      "y": "-8%",
      "width": "116%",
      "height": "116%"
    },
    "colorInterpolation": "sRGB",
    "primitives": [
      {
        "id": "marble-turb",
        "type": "feTurbulence",
        "attributes": {
          "type": "fractalNoise",
          "baseFrequency": "0.012 0.07",
          "numOctaves": 4,
          "seed": 37,
          "result": "stone"
        }
      },
      {
        "id": "marble-threshold",
        "type": "feColorMatrix",
        "attributes": {
          "in": "stone",
          "type": "matrix",
          "values": "0 0 0 0 0.08  0 0 0 0 0.1  0 0 0 0 0.14  0 0 0 13 -6.3",
          "result": "veins"
        }
      },
      {
        "id": "marble-disp",
        "type": "feDisplacementMap",
        "attributes": {
          "in": "veins",
          "in2": "stone",
          "scale": 14,
          "xChannelSelector": "R",
          "yChannelSelector": "G",
          "result": "warpedVeins"
        }
      },
      {
        "id": "marble-blend",
        "type": "feBlend",
        "attributes": {
          "in": "SourceGraphic",
          "in2": "warpedVeins",
          "mode": "multiply"
        }
      }
    ],
    "parameters": [
      {
        "key": "vein-x",
        "label": "Vein X",
        "type": "number",
        "default": 0.012,
        "binding": {
          "primitiveId": "marble-turb",
          "attribute": "baseFrequency",
          "component": 0
        },
        "min": 0.003,
        "max": 0.05,
        "step": 0.001
      },
      {
        "key": "vein-y",
        "label": "Vein Y",
        "type": "number",
        "default": 0.07,
        "binding": {
          "primitiveId": "marble-turb",
          "attribute": "baseFrequency",
          "component": 1
        },
        "min": 0.01,
        "max": 0.2,
        "step": 0.002
      },
      {
        "key": "threshold-mult",
        "label": "Threshold Multiplier",
        "type": "number",
        "default": 13,
        "binding": {
          "primitiveId": "marble-threshold",
          "attribute": "values",
          "component": 18
        },
        "min": 5,
        "max": 24,
        "step": 1
      },
      {
        "key": "threshold-sub",
        "label": "Threshold Offset",
        "type": "number",
        "default": -6.3,
        "binding": {
          "primitiveId": "marble-threshold",
          "attribute": "values",
          "component": 19
        },
        "min": -12,
        "max": -1,
        "step": 0.1
      },
      {
        "key": "vein-warp",
        "label": "Vein Warp",
        "type": "number",
        "default": 14,
        "binding": {
          "primitiveId": "marble-disp",
          "attribute": "scale"
        },
        "min": 0,
        "max": 35,
        "step": 1
      }
    ],
    "presets": {
      "carrara-fine": {
        "name": "Carrara Fine",
        "description": "Thin quiet grey veining for broad pale surfaces.",
        "values": {
          "vein-x": 0.008,
          "vein-y": 0.052,
          "threshold-mult": 10,
          "threshold-sub": -4.8,
          "vein-warp": 9
        }
      },
      "calacatta-bold": {
        "name": "Calacatta Bold",
        "description": "Large dramatic mineral streaks with stronger warping.",
        "values": {
          "vein-x": 0.016,
          "vein-y": 0.09,
          "threshold-mult": 16,
          "threshold-sub": -7.4,
          "vein-warp": 22
        }
      },
      "nero-vein": {
        "name": "Nero Vein",
        "description": "Dense concentrated veins for dark stone treatments.",
        "values": {
          "vein-x": 0.023,
          "vein-y": 0.13,
          "threshold-mult": 20,
          "threshold-sub": -9.2,
          "vein-warp": 17
        }
      }
    },
    "performance": {
      "tier": "moderate",
      "animated": false,
      "primitiveCount": 4,
      "recommendedMaxInstances": 8,
      "recommendedMaxAreaPx": 900000
    },
    "accessibility": {
      "decorative": true,
      "reducedMotionFallback": null,
      "notes": "Do not apply to essential body text without an unfiltered semantic duplicate."
    },
    "governance": {
      "recommendedUses": [
        "marble cards",
        "architectural panels",
        "premium dividers"
      ],
      "avoid": [
        "body copy",
        "small icons",
        "stacking with heavy lithographic grain"
      ]
    },
    "source": {
      "origin": "SVG Filter Atelier v2",
      "migration": "v0.1 signature material migration"
    }
  },
  {
    "$schema": "../../schema/svg-filter-recipe.schema.json",
    "id": "mycelial-bloom",
    "name": "Mycelial Bloom Network",
    "version": "0.1.0",
    "status": "approved",
    "family": "living",
    "intent": [
      "branching luminous network",
      "biological threshold field",
      "soft hyphal glow"
    ],
    "tags": [
      "mycelial",
      "living-system",
      "threshold",
      "network",
      "glow"
    ],
    "filterRegion": {
      "x": "-12%",
      "y": "-12%",
      "width": "124%",
      "height": "124%"
    },
    "colorInterpolation": "sRGB",
    "primitives": [
      {
        "id": "mycelium-turb",
        "type": "feTurbulence",
        "attributes": {
          "type": "fractalNoise",
          "baseFrequency": 0.027,
          "numOctaves": 5,
          "seed": 29,
          "result": "field"
        }
      },
      {
        "id": "mycelium-threshold",
        "type": "feColorMatrix",
        "attributes": {
          "in": "field",
          "type": "matrix",
          "values": "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 22 -10.2",
          "result": "veins"
        }
      },
      {
        "id": "mycelium-morph",
        "type": "feMorphology",
        "attributes": {
          "in": "veins",
          "operator": "dilate",
          "radius": 0.65,
          "result": "network"
        }
      },
      {
        "id": "mycelium-flood",
        "type": "feFlood",
        "attributes": {
          "flood-color": "#9bffb1",
          "flood-opacity": 0.88,
          "result": "life"
        }
      },
      {
        "id": "mycelium-threads",
        "type": "feComposite",
        "attributes": {
          "in": "life",
          "in2": "network",
          "operator": "in",
          "result": "threads"
        }
      },
      {
        "id": "mycelium-glow",
        "type": "feGaussianBlur",
        "attributes": {
          "in": "threads",
          "stdDeviation": 2.2,
          "result": "halo"
        }
      },
      {
        "id": "mycelium-merge",
        "type": "feMerge",
        "attributes": {},
        "children": [
          {
            "id": "mycelium-node-halo",
            "type": "feMergeNode",
            "attributes": {
              "in": "halo"
            }
          },
          {
            "id": "mycelium-node-thread",
            "type": "feMergeNode",
            "attributes": {
              "in": "threads"
            }
          },
          {
            "id": "mycelium-node-source",
            "type": "feMergeNode",
            "attributes": {
              "in": "SourceGraphic"
            }
          }
        ]
      }
    ],
    "parameters": [
      {
        "key": "network-scale",
        "label": "Network Scale",
        "type": "number",
        "default": 0.027,
        "binding": {
          "primitiveId": "mycelium-turb",
          "attribute": "baseFrequency"
        },
        "min": 0.005,
        "max": 0.09,
        "step": 0.001
      },
      {
        "key": "threshold-mult",
        "label": "Threshold Multiplier",
        "type": "number",
        "default": 22,
        "binding": {
          "primitiveId": "mycelium-threshold",
          "attribute": "values",
          "component": 18
        },
        "min": 8,
        "max": 35,
        "step": 1
      },
      {
        "key": "threshold-sub",
        "label": "Threshold Offset",
        "type": "number",
        "default": -10.2,
        "binding": {
          "primitiveId": "mycelium-threshold",
          "attribute": "values",
          "component": 19
        },
        "min": -18,
        "max": -2,
        "step": 0.2
      },
      {
        "key": "thread-radius",
        "label": "Thread Radius",
        "type": "number",
        "default": 0.65,
        "binding": {
          "primitiveId": "mycelium-morph",
          "attribute": "radius"
        },
        "min": 0,
        "max": 3,
        "step": 0.05
      },
      {
        "key": "glow",
        "label": "Glow",
        "type": "number",
        "default": 2.2,
        "binding": {
          "primitiveId": "mycelium-glow",
          "attribute": "stdDeviation"
        },
        "min": 0,
        "max": 7,
        "step": 0.2
      }
    ],
    "presets": {
      "biolume-web": {
        "name": "Biolume Web",
        "description": "Balanced luminous network for feature surfaces.",
        "values": {
          "network-scale": 0.027,
          "threshold-mult": 22,
          "threshold-sub": -10.2,
          "thread-radius": 0.65,
          "glow": 2.2
        }
      },
      "fine-hyphae": {
        "name": "Fine Hyphae",
        "description": "Thin detailed threads with restrained glow.",
        "values": {
          "network-scale": 0.048,
          "threshold-mult": 18,
          "threshold-sub": -8.8,
          "thread-radius": 0.25,
          "glow": 1
        }
      },
      "dense-colony": {
        "name": "Dense Colony",
        "description": "Broader interconnected growth and atmospheric bloom.",
        "values": {
          "network-scale": 0.015,
          "threshold-mult": 28,
          "threshold-sub": -12.4,
          "thread-radius": 1.4,
          "glow": 4.2
        }
      }
    },
    "performance": {
      "tier": "heavy",
      "animated": false,
      "primitiveCount": 7,
      "recommendedMaxInstances": 4,
      "recommendedMaxAreaPx": 650000
    },
    "accessibility": {
      "decorative": true,
      "reducedMotionFallback": null,
      "notes": "Do not apply to essential body text without an unfiltered semantic duplicate."
    },
    "governance": {
      "recommendedUses": [
        "ambient hero panels",
        "living-system diagrams",
        "progress or network metaphors"
      ],
      "avoid": [
        "small text",
        "dense data tables",
        "continuous animation without reduced-motion fallback"
      ]
    },
    "source": {
      "origin": "SVG Filter Atelier v2",
      "migration": "v0.1 signature material migration"
    }
  },
  {
    "$schema": "../../schema/svg-filter-recipe.schema.json",
    "id": "nacre-laminate",
    "name": "Nacre Laminate",
    "version": "0.1.0",
    "status": "approved",
    "family": "optical",
    "intent": [
      "iridescent laminate",
      "pearlescent depth",
      "directional shell grain"
    ],
    "tags": [
      "nacre",
      "abalone",
      "pearl",
      "specular",
      "layered-light"
    ],
    "filterRegion": {
      "x": "-12%",
      "y": "-12%",
      "width": "124%",
      "height": "124%"
    },
    "colorInterpolation": "sRGB",
    "primitives": [
      {
        "id": "nacre-turb",
        "type": "feTurbulence",
        "attributes": {
          "type": "fractalNoise",
          "baseFrequency": "0.012 0.08",
          "numOctaves": 4,
          "seed": 11,
          "result": "grain"
        }
      },
      {
        "id": "nacre-color",
        "type": "feColorMatrix",
        "attributes": {
          "in": "grain",
          "type": "matrix",
          "values": "0.7 0.1 0.2 0 0.12  0.16 0.72 0.12 0 0.14  0.08 0.2 0.78 0 0.24  0 0 0 0.55 0",
          "result": "pearl"
        }
      },
      {
        "id": "nacre-light",
        "type": "feSpecularLighting",
        "attributes": {
          "in": "grain",
          "surfaceScale": 5,
          "specularConstant": 1.2,
          "specularExponent": 28,
          "lighting-color": "#e9fbff",
          "result": "shine"
        },
        "children": [
          {
            "id": "nacre-dl",
            "type": "feDistantLight",
            "attributes": {
              "azimuth": 225,
              "elevation": 55
            }
          }
        ]
      },
      {
        "id": "nacre-mask",
        "type": "feComposite",
        "attributes": {
          "in": "shine",
          "in2": "SourceGraphic",
          "operator": "in",
          "result": "shineMask"
        }
      },
      {
        "id": "nacre-base",
        "type": "feBlend",
        "attributes": {
          "in": "SourceGraphic",
          "in2": "pearl",
          "mode": "screen",
          "result": "base"
        }
      },
      {
        "id": "nacre-blend",
        "type": "feBlend",
        "attributes": {
          "in": "base",
          "in2": "shineMask",
          "mode": "screen"
        }
      }
    ],
    "parameters": [
      {
        "key": "grain-x",
        "label": "Grain X",
        "type": "number",
        "default": 0.012,
        "binding": {
          "primitiveId": "nacre-turb",
          "attribute": "baseFrequency",
          "component": 0
        },
        "min": 0.004,
        "max": 0.05,
        "step": 0.001
      },
      {
        "key": "grain-y",
        "label": "Grain Y",
        "type": "number",
        "default": 0.08,
        "binding": {
          "primitiveId": "nacre-turb",
          "attribute": "baseFrequency",
          "component": 1
        },
        "min": 0.02,
        "max": 0.2,
        "step": 0.005
      },
      {
        "key": "surface-scale",
        "label": "Surface Scale",
        "type": "number",
        "default": 5,
        "binding": {
          "primitiveId": "nacre-light",
          "attribute": "surfaceScale"
        },
        "min": 1,
        "max": 10,
        "step": 0.5
      },
      {
        "key": "specular-exponent",
        "label": "Specular Exponent",
        "type": "number",
        "default": 28,
        "binding": {
          "primitiveId": "nacre-light",
          "attribute": "specularExponent"
        },
        "min": 4,
        "max": 60,
        "step": 2
      },
      {
        "key": "azimuth",
        "label": "Light Azimuth",
        "type": "number",
        "default": 225,
        "binding": {
          "primitiveId": "nacre-dl",
          "attribute": "azimuth"
        },
        "min": 0,
        "max": 360,
        "step": 5,
        "unit": "deg"
      }
    ],
    "presets": {
      "pearl-calm": {
        "name": "Pearl Calm",
        "description": "Soft, low-frequency shell depth for broad surfaces.",
        "values": {
          "grain-x": 0.009,
          "grain-y": 0.055,
          "surface-scale": 3.5,
          "specular-exponent": 18,
          "azimuth": 210
        }
      },
      "abalone-ridge": {
        "name": "Abalone Ridge",
        "description": "Sharper directional ridges and concentrated shell highlights.",
        "values": {
          "grain-x": 0.014,
          "grain-y": 0.11,
          "surface-scale": 6.5,
          "specular-exponent": 38,
          "azimuth": 250
        }
      },
      "moon-shell": {
        "name": "Moon Shell",
        "description": "Subdued cool nacre for secondary surfaces.",
        "values": {
          "grain-x": 0.006,
          "grain-y": 0.035,
          "surface-scale": 2.5,
          "specular-exponent": 12,
          "azimuth": 165
        }
      }
    },
    "performance": {
      "tier": "heavy",
      "animated": false,
      "primitiveCount": 6,
      "recommendedMaxInstances": 4,
      "recommendedMaxAreaPx": 700000
    },
    "accessibility": {
      "decorative": true,
      "reducedMotionFallback": null,
      "notes": "Do not apply to essential body text without an unfiltered semantic duplicate."
    },
    "governance": {
      "recommendedUses": [
        "hero surface",
        "artwork card",
        "selected navigation state"
      ],
      "avoid": [
        "long body text",
        "more than two optical effects on one component",
        "large continuously scrolling backgrounds"
      ]
    },
    "source": {
      "origin": "SVG Filter Atelier v2",
      "migration": "v0.1 signature material migration"
    }
  },
  {
    "$schema": "../../schema/svg-filter-recipe.schema.json",
    "id": "stained-glass-light",
    "name": "Stained-Glass Light",
    "version": "0.1.0",
    "status": "approved",
    "family": "optical",
    "intent": [
      "prismatic translucent distortion",
      "jewel color field",
      "glass highlight"
    ],
    "tags": [
      "stained-glass",
      "prismatic",
      "displacement",
      "specular",
      "jewel"
    ],
    "filterRegion": {
      "x": "-10%",
      "y": "-10%",
      "width": "120%",
      "height": "120%"
    },
    "colorInterpolation": "sRGB",
    "primitives": [
      {
        "id": "glass-turb",
        "type": "feTurbulence",
        "attributes": {
          "type": "fractalNoise",
          "baseFrequency": 0.018,
          "numOctaves": 3,
          "seed": 23,
          "result": "noise"
        }
      },
      {
        "id": "glass-disp",
        "type": "feDisplacementMap",
        "attributes": {
          "in": "SourceGraphic",
          "in2": "noise",
          "scale": 7,
          "xChannelSelector": "R",
          "yChannelSelector": "B",
          "result": "warped"
        }
      },
      {
        "id": "glass-color",
        "type": "feColorMatrix",
        "attributes": {
          "in": "noise",
          "type": "matrix",
          "values": "1.2 0.15 0 0 0.05  0 0.85 0.35 0 0.02  0.2 0 1.15 0 0.12  0 0 0 0.58 0",
          "result": "colorField"
        }
      },
      {
        "id": "glass-blend",
        "type": "feBlend",
        "attributes": {
          "in": "warped",
          "in2": "colorField",
          "mode": "overlay",
          "result": "colored"
        }
      },
      {
        "id": "glass-light",
        "type": "feSpecularLighting",
        "attributes": {
          "in": "noise",
          "surfaceScale": 3,
          "specularConstant": 0.9,
          "specularExponent": 24,
          "lighting-color": "#ffffff",
          "result": "spark"
        },
        "children": [
          {
            "id": "glass-dl",
            "type": "feDistantLight",
            "attributes": {
              "azimuth": 310,
              "elevation": 48
            }
          }
        ]
      },
      {
        "id": "glass-finish",
        "type": "feBlend",
        "attributes": {
          "in": "colored",
          "in2": "spark",
          "mode": "screen"
        }
      }
    ],
    "parameters": [
      {
        "key": "cell-scale",
        "label": "Cell Scale",
        "type": "number",
        "default": 0.018,
        "binding": {
          "primitiveId": "glass-turb",
          "attribute": "baseFrequency"
        },
        "min": 0.005,
        "max": 0.08,
        "step": 0.001
      },
      {
        "key": "displacement",
        "label": "Displacement",
        "type": "number",
        "default": 7,
        "binding": {
          "primitiveId": "glass-disp",
          "attribute": "scale"
        },
        "min": 0,
        "max": 24,
        "step": 1
      },
      {
        "key": "surface-scale",
        "label": "Surface Scale",
        "type": "number",
        "default": 3,
        "binding": {
          "primitiveId": "glass-light",
          "attribute": "surfaceScale"
        },
        "min": 0.5,
        "max": 8,
        "step": 0.5
      },
      {
        "key": "highlight",
        "label": "Highlight",
        "type": "number",
        "default": 0.9,
        "binding": {
          "primitiveId": "glass-light",
          "attribute": "specularConstant"
        },
        "min": 0.1,
        "max": 2.5,
        "step": 0.05
      }
    ],
    "presets": {
      "cathedral-calm": {
        "name": "Cathedral Calm",
        "description": "Broad quiet cells and low highlight intensity.",
        "values": {
          "cell-scale": 0.012,
          "displacement": 4,
          "surface-scale": 2,
          "highlight": 0.55
        }
      },
      "jewel-shift": {
        "name": "Jewel Shift",
        "description": "Dense prismatic facets for decorative artwork.",
        "values": {
          "cell-scale": 0.028,
          "displacement": 11,
          "surface-scale": 4.5,
          "highlight": 1.4
        }
      },
      "fractured-light": {
        "name": "Fractured Light",
        "description": "Sharper displacement and bright broken highlights.",
        "values": {
          "cell-scale": 0.052,
          "displacement": 18,
          "surface-scale": 6.5,
          "highlight": 2
        }
      }
    },
    "performance": {
      "tier": "heavy",
      "animated": false,
      "primitiveCount": 6,
      "recommendedMaxInstances": 4,
      "recommendedMaxAreaPx": 650000
    },
    "accessibility": {
      "decorative": true,
      "reducedMotionFallback": null,
      "notes": "Do not apply to essential body text without an unfiltered semantic duplicate."
    },
    "governance": {
      "recommendedUses": [
        "hero artwork",
        "decorative window panels",
        "featured commerce imagery"
      ],
      "avoid": [
        "body text",
        "repeating card grids above six instances",
        "stacking with nacre on the same element"
      ]
    },
    "source": {
      "origin": "SVG Filter Atelier v2",
      "migration": "v0.1 signature material migration"
    }
  },
  {
    "$schema": "../../schema/svg-filter-recipe.schema.json",
    "id": "washi-fiber",
    "name": "Washi Fiber Field",
    "version": "0.1.0",
    "status": "approved",
    "family": "tactile",
    "intent": [
      "directional paper fiber",
      "kozo texture",
      "soft handmade relief"
    ],
    "tags": [
      "washi",
      "kozo",
      "fiber",
      "paper",
      "directional-noise"
    ],
    "filterRegion": {
      "x": "0%",
      "y": "0%",
      "width": "100%",
      "height": "100%"
    },
    "colorInterpolation": "sRGB",
    "primitives": [
      {
        "id": "washi-turb",
        "type": "feTurbulence",
        "attributes": {
          "type": "fractalNoise",
          "baseFrequency": "0.006 0.48",
          "numOctaves": 4,
          "seed": 19,
          "result": "fiber"
        }
      },
      {
        "id": "washi-transfer",
        "type": "feComponentTransfer",
        "attributes": {
          "in": "fiber",
          "result": "softFiber"
        },
        "children": [
          {
            "id": "washi-alpha",
            "type": "feFuncA",
            "attributes": {
              "type": "linear",
              "slope": 0.72,
              "intercept": -0.08
            }
          }
        ]
      },
      {
        "id": "washi-light",
        "type": "feDiffuseLighting",
        "attributes": {
          "in": "fiber",
          "surfaceScale": 1.8,
          "lighting-color": "#fff4dc",
          "result": "relief"
        },
        "children": [
          {
            "id": "washi-dl",
            "type": "feDistantLight",
            "attributes": {
              "azimuth": 35,
              "elevation": 62
            }
          }
        ]
      },
      {
        "id": "washi-ink",
        "type": "feBlend",
        "attributes": {
          "in": "SourceGraphic",
          "in2": "softFiber",
          "mode": "multiply",
          "result": "inked"
        }
      },
      {
        "id": "washi-finish",
        "type": "feBlend",
        "attributes": {
          "in": "inked",
          "in2": "relief",
          "mode": "screen"
        }
      }
    ],
    "parameters": [
      {
        "key": "fiber-x",
        "label": "Fiber X",
        "type": "number",
        "default": 0.006,
        "binding": {
          "primitiveId": "washi-turb",
          "attribute": "baseFrequency",
          "component": 0
        },
        "min": 0.002,
        "max": 0.03,
        "step": 0.001
      },
      {
        "key": "fiber-y",
        "label": "Fiber Y",
        "type": "number",
        "default": 0.48,
        "binding": {
          "primitiveId": "washi-turb",
          "attribute": "baseFrequency",
          "component": 1
        },
        "min": 0.1,
        "max": 0.9,
        "step": 0.02
      },
      {
        "key": "alpha-slope",
        "label": "Fiber Opacity",
        "type": "number",
        "default": 0.72,
        "binding": {
          "primitiveId": "washi-alpha",
          "attribute": "slope"
        },
        "min": 0.2,
        "max": 1.5,
        "step": 0.01
      },
      {
        "key": "surface-scale",
        "label": "Relief",
        "type": "number",
        "default": 1.8,
        "binding": {
          "primitiveId": "washi-light",
          "attribute": "surfaceScale"
        },
        "min": 0.5,
        "max": 5,
        "step": 0.05
      }
    ],
    "presets": {
      "kozo-fine": {
        "name": "Kozo Fine",
        "description": "Quiet long fibers for premium paper surfaces.",
        "values": {
          "fiber-x": 0.004,
          "fiber-y": 0.56,
          "alpha-slope": 0.55,
          "surface-scale": 1.25
        }
      },
      "deckle-rough": {
        "name": "Deckle Rough",
        "description": "Visible rough fibers and deeper directional relief.",
        "values": {
          "fiber-x": 0.011,
          "fiber-y": 0.34,
          "alpha-slope": 0.92,
          "surface-scale": 2.8
        }
      },
      "sumi-worn": {
        "name": "Sumi Worn",
        "description": "Dense fiber field suited to inked or archival treatments.",
        "values": {
          "fiber-x": 0.007,
          "fiber-y": 0.68,
          "alpha-slope": 1.08,
          "surface-scale": 1.7
        }
      }
    },
    "performance": {
      "tier": "moderate",
      "animated": false,
      "primitiveCount": 5,
      "recommendedMaxInstances": 10,
      "recommendedMaxAreaPx": 1200000
    },
    "accessibility": {
      "decorative": true,
      "reducedMotionFallback": null,
      "notes": "Do not apply to essential body text without an unfiltered semantic duplicate."
    },
    "governance": {
      "recommendedUses": [
        "paper panels",
        "editorial cards",
        "quiet page backgrounds"
      ],
      "avoid": [
        "small type below 16px",
        "stacking with dense lithographic grain",
        "high-contrast accessibility surfaces"
      ]
    },
    "source": {
      "origin": "SVG Filter Atelier v2",
      "migration": "v0.1 signature material migration"
    }
  }
] as const;
