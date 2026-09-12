'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const names = ['architecture-planning','backend-engineering','frontend-engineering','systematic-debugging','ui-ux-review','code-review','test-verify','database-api-evolution','execution-loop','deployment-safety'].sort();
test('exactly ten discoverable, self-contained core skills', () => {
  const actual = fs.readdirSync(path.join(root, 'skills')).filter(name => fs.existsSync(path.join(root, 'skills', name, 'SKILL.md'))).sort();
  assert.deepEqual(actual, names);
  for (const name of names) {
    const file = path.join(root, 'skills', name, 'SKILL.md');
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(text.startsWith('---\n'), file);
    const frontmatter = text.split('---')[1];
    assert.match(frontmatter, new RegExp('\\nname: ' + name + '\\n'));
    assert.match(frontmatter, /\ndescription: .+/);
    for (const link of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (!/^(https?:|#)/.test(link[1])) assert.ok(fs.existsSync(path.resolve(path.dirname(file), link[1])), 'Broken reference: ' + link[1]);
    }
    assert.doesNotMatch(text, /[A-Z]:\\\\Users\\\\|truestack-orchestrate|obsidian-task-update/i);
  }
});
test('release metadata agrees and plugin has no automatic hooks', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/plugin.json')));
  const marketplace = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json')));
  assert.equal(manifest.version, '0.1.0');
  assert.equal(marketplace.plugins[0].version, manifest.version);
  assert.equal(manifest.name, marketplace.plugins[0].name);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'hooks/hooks.json'))), {hooks:{}});
  assert.ok(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').includes('## [0.1.0]'));
});
