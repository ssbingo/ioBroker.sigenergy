import globals from "globals";
import ioBrokerConfig from "@iobroker/eslint-config";

export default [
    ...ioBrokerConfig,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
    },
    {
        ignores: ["admin/", "test/", "node_modules/"],
    },
];
