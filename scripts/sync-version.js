const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(ROOT, '.version');

function readVersion() {
  return fs.readFileSync(VERSION_FILE, 'utf8').trim();
}

function updateJson(filePath, version) {
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);
  if (json.version) {
    json.version = version;
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
    console.log(`Updated ${filePath} to ${version}`);
  }
}

function updatePyProject(filePath, version) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updatedContent = content.replace(/^version\s*=\s*".*"/m, `version = "${version}"`);
  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath} to ${version}`);
  }
}

try {
  const version = readVersion();
  console.log(`Syncing version ${version}...`);

  const files = {
    json: [
      path.join(ROOT, 'package.json'),
      path.join(ROOT, 'apps/desktop/package.json'),
      path.join(ROOT, 'packages/shared/package.json'),
    ],
    toml: [
      path.join(ROOT, 'apps/backend/pyproject.toml'),
    ]
  };

  files.json.forEach(f => {
    if (fs.existsSync(f)) updateJson(f, version);
  });
  files.toml.forEach(f => {
    if (fs.existsSync(f)) updatePyProject(f, version);
  });

  console.log('Version sync complete.');
} catch (err) {
  console.error('Error syncing version:', err);
  process.exit(1);
}
