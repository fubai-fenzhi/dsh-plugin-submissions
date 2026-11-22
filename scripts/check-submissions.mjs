#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const INSTALL_SCRIPTS = ['preinstall', 'install', 'postinstall', 'prepare'];
const BINARY_EXT = new Set(['.exe', '.dll', '.node', '.so', '.dylib', '.bin', '.zip', '.tar', '.tgz', '.7z', '.rar']);
const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.json', '.md', '.yml', '.yaml', '.txt', '.ts']);
const SECRET_PATTERNS = [
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bnpm_[A-Za-z0-9]{20,}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
const ABS_PATH = /[A-Za-z]:\\[^\s'"`]+/;

let failed = 0;
const ok = (id) => console.log(`OK   ${id}`);
const bad = (id, detail) => {
  failed += 1;
  console.log(`FAIL ${id}: ${detail}`);
};

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error('usage: node scripts/check-submissions.mjs <submissions/<package>>');
  process.exit(2);
}

const manifest = join(dir, 'package.json');
if (!existsSync(manifest)) {
  bad('package.json', 'missing');
} else {
  try {
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    ok('package.json');
    const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    const fields = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      license: pkg.license,
      repository,
      homepage: pkg.homepage,
    };
    for (const [id, value] of Object.entries(fields)) {
      if (typeof value === 'string' && value.trim()) ok(id);
      else bad(id, 'required');
    }
    const keywords = Array.isArray(pkg.keywords) ? pkg.keywords : [];
    if (keywords.includes('dsh-plugin')) ok('keywords');
    else bad('keywords', 'must include dsh-plugin');

    const patch = pkg.dsh?.bundle?.patch;
    if (typeof patch === 'string' && existsSync(join(dir, patch))) ok('dsh.bundle');
    else bad('dsh.bundle', 'package.json must declare dsh.bundle.patch and the file must exist');

    const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};
    const installs = INSTALL_SCRIPTS.filter((name) => typeof scripts[name] === 'string');
    if (installs.length) bad('install-scripts', `forbidden: ${installs.join(', ')}`);
    else ok('install-scripts');

    if (pkg.private === true) bad('private', 'remove private:true');
    else ok('private');
  } catch (error) {
    bad('package.json', `invalid JSON: ${String(error)}`);
  }
}

if (existsSync(join(dir, 'SUBMISSION.md'))) ok('SUBMISSION.md');
else bad('SUBMISSION.md', 'missing');

const files = [];
(function walk(current) {
  for (const entry of readdirSync(current)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const full = join(current, entry);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(relative(dir, full).replaceAll('\\', '/'));
  }
})(dir);

if (existsSync(join(dir, 'node_modules'))) bad('node_modules', 'remove it');
else ok('node_modules');

const basenames = files.map((file) => file.split('/').pop());
if (basenames.some((name) => /^readme(\.md|\.markdown)?$/i.test(name))) ok('readme');
else bad('readme', 'missing README.md');
if (basenames.some((name) => /^licen[cs]e(\.md|\.txt)?$/i.test(name))) ok('license-file');
else bad('license-file', 'missing LICENSE');

const binaries = files.filter((file) => BINARY_EXT.has(extname(file).toLowerCase()));
if (binaries.length) bad('binaries', `remove: ${binaries.slice(0, 5).join(', ')}`);
else ok('binaries');

const secrets = [];
const paths = [];
for (const file of files) {
  if (!TEXT_EXT.has(extname(file).toLowerCase())) continue;
  if (statSync(join(dir, file)).size > 1024 * 1024) continue;
  const text = readFileSync(join(dir, file), 'utf8');
  if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) secrets.push(file);
  const runtime = file === 'index.js' || file.startsWith('lib/') || file.startsWith('src/');
  if (runtime && ABS_PATH.test(text)) paths.push(file);
}
if (secrets.length) bad('secrets', `possible secrets in: ${secrets.slice(0, 5).join(', ')}`);
else ok('secrets');
if (paths.length) bad('absolute-paths', `hardcoded paths in: ${paths.slice(0, 5).join(', ')}`);
else ok('absolute-paths');

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nPASS');
