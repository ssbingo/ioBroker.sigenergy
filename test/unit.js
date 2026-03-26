'use strict';

const path = require('node:path');
const { tests } = require('@iobroker/testing');

// Run unit tests — tests the adapter startup in a mocked environment
tests.unit(path.join(__dirname, '..'), {
    // Define your own tests inside defineAdditionalTests
    // defineAdditionalTests() {
    //     it('works', () => {
    //         // see @iobroker/testing docs
    //     });
    // },
});
