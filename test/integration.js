'use strict';

const path = require('node:path');
const { tests } = require('@iobroker/testing');

// Run integration tests — tests the adapter startup against a real JS-Controller
tests.integration(path.join(__dirname, '..'), {
    // If the adapter calls process.exit during startup with code 11,
    // uncomment this to allow that exit code (e.g. if missing config exits with 11)
    allowedExitCodes: [11],
});
