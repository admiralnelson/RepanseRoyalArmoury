import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["compiler/*"],
}, ...compat.extends("plugin:@typescript-eslint/recommended"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
    },

    rules: {
        "@typescript-eslint/ban-types": ["error", {
            types: {
                Array: "Because Typescript to Lua doesn't support it. Use [] instead, example number[] or Lord[]",
                Map: "Some Map constrcut such as .foreach is not supported. Use LuaMap<K, V> instead, however you are allowed to use new Map construct and cast it to LuaMap<> if you need to pass it around to other functions",
                RegExp: "Regex is not supported yet.",
            },

            extendDefaults: true,
        }],

        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
    },
}];