import globals from 'globals';
import ioBrokerConfig from '@iobroker/eslint-config';

export default [
	...ioBrokerConfig,
	{
		files: ['*.test.js', 'test/**/*.js'],
		languageOptions: {
			globals: {
				describe: 'readonly',
				it: 'readonly',
				before: 'readonly',
				after: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
			},
		},
	},
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
			},
		},
	},
	{
		ignores: ['admin/', 'test/', 'node_modules/'],
	},
];
