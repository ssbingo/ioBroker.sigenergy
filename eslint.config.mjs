import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        // Specify files to exclude from linting
        ignores: [
            '.dev-server/',
            '.vscode/',
            '*.test.js',
            'test/**/*.js',
            '*.config.mjs',
            'build',
            'dist',
            'admin/build',
            'admin/words.js',
            'admin/admin.d.ts',
            'admin/blockly.js',
            '**/adapter-config.d.ts',
        ],
    },
    {
        // This is a checked-JavaScript project (tsconfig.check.json with checkJs):
        // JSDoc *is* the type system here, so the '@type' tag must be allowed.
        // The default config treats it as redundant and its auto-fixer would
        // delete the annotations.
        rules: {
            'jsdoc/check-tag-names': ['warn', { typed: false }],
        },
    },
];
