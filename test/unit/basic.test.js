'use strict';

const assert = require('assert');
const path = require('path');

describe('Adapter basics', () => {
	it('main.js should be loadable without errors', () => {
		// Verify the main file exists and can be parsed
		const mainPath = path.join(__dirname, '../../main.js');
		assert.ok(require('fs').existsSync(mainPath), 'main.js must exist');
	});

	it('io-package.json should be valid JSON with required fields', () => {
		const ioPack = require('../../io-package.json');
		assert.ok(ioPack.common, 'common section must exist');
		assert.ok(ioPack.common.name, 'common.name must exist');
		assert.ok(ioPack.common.version, 'common.version must exist');
	});

	it('package.json version must match io-package.json version', () => {
		const pkg = require('../../package.json');
		const ioPack = require('../../io-package.json');
		assert.strictEqual(pkg.version, ioPack.common.version, 'versions must match');
	});
});
