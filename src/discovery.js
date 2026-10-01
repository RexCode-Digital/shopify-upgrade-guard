import { readdir, readFile, lstat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { parseVersion } from './versions.js';

export const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', 'vendor', '.next', '.cache']);
const supported = new Set(['.js', '.jsx', '.ts', '.tsx', '.graphql', '.gql', '.toml', '.json']);
export async function discover(root, options = {}) {
  const files = []; const inventory = []; const excludes = options.exclude ?? [];
  async function walk(directory) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.upgradeguard.json') continue;
      const path = join(directory, entry.name); const relativePath = relative(root, path).replaceAll('\\', '/');
      if (entry.isDirectory()) { if (!IGNORED_DIRECTORIES.has(entry.name) && !isExcluded(relativePath, excludes)) await walk(path); continue; }
      if (entry.isSymbolicLink()) continue;
      const extension = entry.name.endsWith('.toml') ? '.toml' : extname(entry.name);
      if (!supported.has(extension) || entry.name.endsWith('.min.js') || isExcluded(relativePath, excludes)) continue;
      const stats = await lstat(path); if (stats.size > 1024 * 1024) continue;
      const text = await readFile(path, 'utf8'); const file = { path, relativePath, text };
      files.push(file); inventory.push(...inventoryFor(file));
    }
  }
  await walk(root); files.sort((a, b) => a.relativePath.localeCompare(b.relativePath)); inventory.sort(compareInventory); return { files, inventory };
}
function inventoryFor(file) {
  const entries = []; const toml = file.relativePath.endsWith('.toml'); const shopifyToml = /(?:^|\/)shopify\.(?:app|extension)\.toml$/.test(file.relativePath);
  const tomlVersion = shopifyToml ? matchVersion(file.text, /(?:^|\n)\s*api_version\s*=\s*["'](\d{4}-(?:0[147]|10))["']/g) : [];
  for (const match of tomlVersion) entries.push({ surface: surfaceForToml(file.relativePath, file.text), version: match.version, file: file.relativePath, line: match.line, source: 'api_version' });
  if (!toml) {
    for (const match of matchVersion(file.text, /\/admin\/api\/(\d{4}-(?:0[147]|10))\/(?!graphql(?:\.json)?\b)/g)) entries.push({ surface: 'admin_rest_api', version: match.version, file: file.relativePath, line: match.line, source: 'admin_api_url' });
    for (const match of matchVersion(file.text, /\/admin\/api\/(\d{4}-(?:0[147]|10))\/graphql(?:\.json)?\b/g)) entries.push({ surface: 'admin_graphql_api', version: match.version, file: file.relativePath, line: match.line, source: 'admin_graphql_url' });
    if (/shopify/i.test(file.text)) for (const match of matchVersion(file.text, /\b(?:apiVersion|api_version)\s*[:=]\s*["'](\d{4}-(?:0[147]|10))["']/g)) entries.push({ surface: 'shopify_client', version: match.version, file: file.relativePath, line: match.line, source: 'client_configuration' });
  }
  return [...new Map(entries.map((item) => [`${item.surface}|${item.version}|${item.file}`, item])).values()];
}
function matchVersion(text, pattern) { return [...text.matchAll(pattern)].map((match) => { const before = text.slice(0, match.index + match[0].indexOf(match[1])); return { version: parseVersion(match[1]), line: before.split('\n').length }; }); }
function surfaceForToml(path, text) { const normalized = path.toLowerCase(); if (normalized.includes('checkout') || /\bblock_progress\b/.test(text)) return 'checkout_ui_extension'; if (normalized.includes('customer')) return 'customer_account_ui_extension'; if (normalized.includes('pos')) return 'pos_ui_extension'; if (normalized.includes('function')) return 'shopify_function'; return normalized.endsWith('shopify.app.toml') ? 'shopify_app' : 'extension'; }
function compareInventory(a, b) { return `${a.file}:${a.line}:${a.surface}`.localeCompare(`${b.file}:${b.line}:${b.surface}`); }
function isExcluded(path, patterns) { return patterns.some((pattern) => globToRegExp(pattern).test(path)); }
export function validateExcludePattern(pattern) { globToRegExp(pattern); return pattern; }
function globToRegExp(pattern) { if (typeof pattern !== 'string' || pattern.length > 200 || pattern.startsWith('/') || pattern.includes('..')) throw new Error(`Invalid exclude pattern: ${pattern}`); const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '§').replace(/\*/g, '[^/]*').replace(/§/g, '.*').replace(/\?/g, '[^/]'); return new RegExp(`^${escaped}$`); }
