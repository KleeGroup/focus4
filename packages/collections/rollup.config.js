// @ts-check
// @ts-ignore
import pkg from "./package.json";
import {onwarn, abortOnError} from "../../scripts/rollup";

import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss";
import copy from "rollup-plugin-copy-glob";

import {generateTypings} from "@focus4/styling/lib/generator";

export default (async () => {
    await generateTypings("src");

    /** @type {import("rollup").RollupOptions} */
    const config = {
        input: "src/focus4.collections.ts",
        plugins: [
            // @ts-ignore
            postcss({extract: true, modules: true}),
            typescript({abortOnError: false}),
            copy([
                {files: "src/list/**/*.css.d.ts", dest: "lib/list"},
                {files: "src/search/**/*.css.d.ts", dest: "lib/search"}
            ]),
            abortOnError
        ],
        treeshake: {
            moduleSideEffects: false
        },
        output: {
            format: "esm",
            file: "lib/focus4.collections.js"
        },
        external: [
            ...Object.keys(pkg.dependencies || {}),
            "classnames",
            "framer-motion",
            "i18next",
            "lodash",
            "mobx",
            "mobx-react",
            "mobx-react-lite",
            "react",
            "tslib"
        ],
        onwarn
    };
    return config;
})();
