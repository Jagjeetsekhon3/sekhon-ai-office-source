'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const { AGENT_TEMPLATES, templatesForWorkspace, selectedTemplate, draftAfterWorkspaceChange } = loadTs('src/shared/agentTemplates.ts');
const { resolveBusinessWorkspace, BUSINESS_WORKSPACE_KEY } = loadTs('src/shared/businessWorkspace.ts');
const studio = ['Studio Manager', 'Product Manager', '3D Product Assistant', 'Website Developer', 'Studio Marketing', 'Business Analyst'];
const agency = ['Business Lead', 'Creative Director', 'Strategist', 'Copywriter', 'Art Director', 'AI Motion', 'Production'];
test('Studio and Agency expose exactly their requested roles without overlap', () => {
  assert.deepEqual(templatesForWorkspace('studio').map(t => t.name).sort(), studio.sort());
  assert.deepEqual(templatesForWorkspace('agency').map(t => t.name).sort(), agency.sort());
  assert.equal(new Set(AGENT_TEMPLATES.map(t => t.id)).size, 13);
  for (const template of AGENT_TEMPLATES) {
    assert.equal(template.label, template.name);
    assert.ok(template.description.length > 10);
    assert.ok(template.goal.length > 80);
    assert.equal(selectedTemplate(template.workspace, template)?.id, template.id);
    assert.equal(selectedTemplate(template.workspace === 'studio' ? 'agency' : 'studio', template), undefined);
  }
});
test('workspace switch clears untouched presets in both directions', () => {
  for (const template of AGENT_TEMPLATES) {
    const next = template.workspace === 'studio' ? 'agency' : 'studio';
    assert.deepEqual(draftAfterWorkspaceChange(template.workspace, next, template), {name:'Agent', description:'a fresh harness', goal:''});
    assert.equal(draftAfterWorkspaceChange(template.workspace, template.workspace, template), template);
  }
});
test('workspace switch preserves custom and imported briefings', () => {
  const preset = templatesForWorkspace('studio')[0];
  for (const key of ['name', 'description', 'goal']) {
    const custom = {...preset, [key]:preset[key] + ' custom'};
    assert.equal(selectedTemplate('studio', custom), undefined);
    assert.equal(draftAfterWorkspaceChange('studio', 'agency', custom), custom);
  }
  assert.equal(draftAfterWorkspaceChange('studio', 'agency', preset, true), preset);
});
test('saved workspace uses existing preference key and falls back safely', () => {
  assert.equal(BUSINESS_WORKSPACE_KEY, 'sekhon.businessWorkspace');
  assert.equal(resolveBusinessWorkspace('agency'), 'agency');
  for (const value of ['studio', null, undefined, '', 'unknown']) assert.equal(resolveBusinessWorkspace(value), 'studio');
});
test('Business Lead retains explicit owner approval for external commitments', () => {
  const lead = templatesForWorkspace('agency').find(t => t.name === 'Business Lead');
  for (const phrase of ['client', 'proposal', 'pricing', 'spend', 'approval']) assert.ok(lead.goal.toLowerCase().includes(phrase), phrase);
});
