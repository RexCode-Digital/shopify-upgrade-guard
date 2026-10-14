import { spawn } from 'node:child_process';
import { lstat, mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

function validateBaseRef(baseRef) {
  if (!baseRef || baseRef.startsWith('-') || baseRef.includes('..') || !/^[A-Za-z0-9_./-]+$/.test(baseRef)) throw new Error('Invalid Git base ref');
}

export async function changedLines(root, baseRef) {
  validateBaseRef(baseRef);
  const output = await runGit(root, ['-c', 'core.quotePath=false', 'diff', '--no-ext-diff', '--no-textconv', '--unified=0', `${baseRef}...HEAD`, '--']);
  const ranges = new Map(); let file = null;
  for (const line of output.split('\n')) {
    if (line.startsWith('+++ b/')) { file = line.slice(6); continue; }
    const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (match && file) { const start = Number(match[1]); const count = Number(match[2] ?? 1); ranges.set(file, [...(ranges.get(file) ?? []), { start, end: start + Math.max(count, 1) - 1 }]); }
  }
  return ranges;
}

export async function withBaseTree(root, baseRef, analyze) {
  validateBaseRef(baseRef);
  const scanRoot = await realpath(resolve(root));
  const repositoryRoot = (await runGit(scanRoot, ['rev-parse', '--show-toplevel'])).trim();
  const scanPath = relative(repositoryRoot, scanRoot);
  if (scanPath === '..' || scanPath.startsWith(`..${sep}`) || isAbsolute(scanPath)) throw new Error('Scan root must be inside its Git repository');
  const base = (await runGit(repositoryRoot, ['rev-parse', '--verify', '--end-of-options', `${baseRef}^{commit}`])).trim();
  const baseCommit = (await runGit(repositoryRoot, ['merge-base', base, 'HEAD'])).trim();
  if (!/^[0-9a-f]{40,64}$/i.test(baseCommit)) throw new Error('Git did not return a valid base commit');
  const parent = await mkdtemp(join(tmpdir(), 'upgradeguard-base-'));
  const worktree = join(parent, 'tree');
  const hooksPath = join(parent, 'empty-hooks');
  const emptyConfig = join(parent, 'empty-config');
  let added = false;
  try {
    await mkdir(hooksPath);
    await writeFile(emptyConfig, '');
    const filterConfig = await runGit(repositoryRoot, ['config', '--local', '--name-only', '--get-regexp', '^filter\\.'], { allowFailure: true });
    if (filterConfig.code !== 0 && filterConfig.code !== 1) throw new Error('Could not inspect Git filter configuration safely');
    const filterNames = new Set(filterConfig.stdout.split('\n').map((key) => key.trim()).filter(Boolean).map((key) => key.slice('filter.'.length, key.lastIndexOf('.'))).filter(Boolean));
    const checkoutOptions = ['-c', `core.hooksPath=${hooksPath}`, '-c', 'core.fsmonitor=false', '-c', `core.attributesFile=${emptyConfig}`, '-c', 'core.autocrlf=false'];
    for (const name of filterNames) checkoutOptions.push('-c', `filter.${name}.smudge=`, '-c', `filter.${name}.process=`, '-c', `filter.${name}.clean=`, '-c', `filter.${name}.required=false`);
    const env = isolatedGitEnvironment(emptyConfig);
    await runGit(repositoryRoot, [...checkoutOptions, 'worktree', 'add', '--detach', worktree, baseCommit], { env });
    added = true;
    let baseRoot = resolve(worktree, scanPath);
    try { const stat = await lstat(baseRoot); if (!stat.isDirectory()) throw new Error('Base scan root must be a regular directory'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; baseRoot = join(parent, 'empty-scan-root'); await mkdir(baseRoot); }
    const renames = await renamedPaths(repositoryRoot, baseCommit, scanPath);
    return await analyze(baseRoot, { baseCommit, renames });
  } finally {
    let cleanupError;
    if (added) try { await runGit(repositoryRoot, ['worktree', 'remove', '--force', worktree]); } catch (error) { cleanupError = error; }
    await rm(parent, { recursive: true, force: true });
    if (cleanupError) throw cleanupError;
  }
}

async function renamedPaths(repositoryRoot, baseCommit, scanPath) {
  const pathspec = scanPath ? `:(literal)${scanPath.replaceAll('\\', '/')}` : '.';
  const output = await runGit(repositoryRoot, ['-c', 'core.quotePath=false', 'diff', '--no-ext-diff', '--no-textconv', '--find-renames', '--name-status', '-z', baseCommit, 'HEAD', '--', pathspec]);
  const fields = output.split('\0'); const renames = new Map();
  const toScanPath = (file) => {
    const normalized = file.replaceAll('\\', '/');
    if (!scanPath) return normalized;
    const prefix = `${scanPath.replaceAll('\\', '/')}/`;
    return normalized.startsWith(prefix) ? normalized.slice(prefix.length) : null;
  };
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (!status) continue;
    const count = /^[RC]/.test(status) ? 2 : 1;
    const before = count === 2 ? fields[index++] : null;
    const after = fields[index++];
    if (status.startsWith('R')) {
      const oldPath = toScanPath(before); const newPath = toScanPath(after);
      if (oldPath && newPath) renames.set(oldPath, newPath);
    }
  }
  return renames;
}

function isolatedGitEnvironment(emptyConfig) {
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: emptyConfig, GIT_CONFIG_SYSTEM: emptyConfig };
  for (const key of Object.keys(env)) if (/^GIT_CONFIG_(?:KEY|VALUE)_\d+$/.test(key)) delete env[key];
  for (const key of ['GIT_CONFIG_COUNT', 'GIT_CONFIG_PARAMETERS', 'GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES']) delete env[key];
  return env;
}

export async function runGit(root, args, options = {}) { return new Promise((resolve, reject) => { const child = spawn('git', args, { cwd: root, env: options.env ?? process.env, stdio: ['ignore', 'pipe', 'pipe'] }); let stdout = ''; let stderr = ''; child.stdout.on('data', (chunk) => { stdout += chunk; }); child.stderr.on('data', (chunk) => { stderr += chunk; }); child.on('error', reject); child.on('close', (code) => code === 0 ? resolve(options.allowFailure ? { code, stdout, stderr } : stdout) : options.allowFailure ? resolve({ code, stdout, stderr }) : reject(new Error(`git ${args[0]} failed: ${stderr.trim()}`))); }); }
