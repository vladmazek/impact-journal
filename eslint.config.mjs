import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [...compat.extends("next/core-web-vitals", "next/typescript")];

const exportedConfig = [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  ...config,
];

export default exportedConfig;
