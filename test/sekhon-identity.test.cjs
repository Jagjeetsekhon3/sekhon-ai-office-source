'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const { migrateSekhonAgent } = loadTs('src/shared/sekhonIdentity.ts');
const { resolveGodName } = loadTs('src/shared/godIdentity.ts');
const { validateHireManifest, parseHireDeepLink } = loadTs('src/shared/hire.ts');
test('legacy name migrates without changing durable identity or saved work', () => {
  const original = { id: 'pam-session', name: 'Pam', character: 'pam', sessionId: 'saved-session', goal: 'Prepare a pitch', archived: true };
  assert.deepEqual(migrateSekhonAgent(original), { ...original, name: 'Creative Director' });
  assert.equal(original.name, 'Pam');
  const custom = { ...original, name: 'Jagjeet' };
  assert.equal(migrateSekhonAgent(custom), custom);
  assert.equal(resolveGodName('Michael'), 'Sekhon Manager');
});
test('both manifest versions import and both link schemes resolve', () => {
  for (const spec of ['sekhon-ai-office/hire@1', 'munder-difflin/hire@1']) {
    const result = validateHireManifest({ spec, name: 'Studio Manager' });
    assert.equal(result.ok, true);
    assert.equal(result.manifest.spec, 'sekhon-ai-office/hire@1');
  }
  for (const scheme of ['sekhonaioffice', 'munderdifflin']) {
    assert.equal(parseHireDeepLink(scheme + '://hire?src=https%3A%2F%2Fexample.com%2Fagent.json'), 'https://example.com/agent.json');
  }
});

test('installer links match Sekhon packaging on every platform', () => {
  const { installerUrl } = loadTs('src/shared/updateState.ts');
  const root = 'https://github.com/Jagjeetsekhon3/sekhon-ai-office-source/releases/download/v0.4.6/';
  assert.equal(installerUrl('v0.4.6', 'win32', 'x64'), root + 'Sekhon-AI-Office-0.4.6-win-x64-setup.exe');
  assert.equal(installerUrl('0.4.6', 'darwin', 'arm64'), root + 'Sekhon-AI-Office-0.4.6-mac-arm64.dmg');
  assert.equal(installerUrl('0.4.6', 'linux', 'x64'), root + 'Sekhon-AI-Office-0.4.6-linux-x86_64.AppImage');
});
