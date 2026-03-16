'use strict';

// Integration tests require a running ioBroker instance.
// Skipped in CI unless IOBROKER_HOST is set.

describe('Adapter integration', () => {
	before(function () {
		if (!process.env.IOBROKER_HOST) {
			this.skip();
		}
	});

	it('placeholder — integration tests require a running ioBroker instance', () => {
		// This test only runs when IOBROKER_HOST is set
	});
});
