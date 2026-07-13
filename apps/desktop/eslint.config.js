import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist", "out", "release", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
  },
];
