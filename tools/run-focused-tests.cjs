'use strict';
// Explicit filenames keep the test command portable: Windows shells do not expand globs.
const { readdirSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const files = readdirSync('test').filter(name => name.endsWith('.test.cjs')).sort().map(name => 'test/' + name);
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
