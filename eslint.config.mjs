import boundaries from "eslint-plugin-boundaries";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Feature-Sliced Design under src/: shared → entities → features → widgets → app.
 * Rules apply only to src/** so root app/, lib/, components/ stay as-is until migrated.
 *
 * Path aliases (tsconfig): @shared/*, @entities/*, @features/*, @widgets/*
 */
const fsdBoundariesBlock = {
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "shared", pattern: "src/shared/**/*" },
      { type: "entities", pattern: "src/entities/**/*" },
      { type: "features", pattern: "src/features/**/*" },
      { type: "widgets", pattern: "src/widgets/**/*" },
      { type: "root-lib", pattern: "lib/**/*" },
      { type: "root-components", pattern: "components/**/*" },
    ],
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          {
            from: ["shared"],
            allow: ["shared", "root-lib"],
          },
          {
            from: ["entities"],
            allow: ["shared", "entities", "root-lib"],
          },
          {
            from: ["features"],
            allow: [
              "shared",
              "entities",
              "features",
              "root-lib",
              "root-components",
            ],
          },
          {
            from: ["widgets"],
            allow: [
              "shared",
              "entities",
              "features",
              "widgets",
              "root-lib",
              "root-components",
            ],
          },
        ],
      },
    ],
  },
};

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    name: "fsd/layer-imports",
    files: ["src/**/*.{ts,tsx,js,mjs,cjs}"],
    ...fsdBoundariesBlock,
  },
];

export default eslintConfig;
