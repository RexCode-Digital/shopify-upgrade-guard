import { spawn } from 'node:child_process';
export async function changedLines(root, baseRef) {
  if (!baseRef || baseRef.startsWith('-') || baseRef.includes('..') || !/^[A-Za-z0-9_./-]+$/.test(baseRef)) throw new Error('Invalid Git base ref');
  const output = await runGit(root, ['-c', 'core.quotePath=false', 'diff', '--no-ext-diff', '--no-textconv', '--unified=0', `${baseRef}...HEAD`, '--']);
  const ranges = new Map(); let file = null;
  for (const line of output.split('\n')) {
    if (line.startsWith('+++ b/')) { file = line.slice(6); continue; }
    const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (match && file) { const start = Number(match[1]); const count = Number(match[2] ?? 1); ranges.set(file, [...(ranges.get(file) ?? []), { start, end: start + Math.max(count, 1) - 1 }]); }
  }
  return ranges;
}
export async function runGit(root, args) { return new Promise((resolve, reject) => { const child = spawn('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }); let stdout = ''; let stderr = ''; child.stdout.on('data', (chunk) => { stdout += chunk; }); child.stderr.on('data', (chunk) => { stderr += chunk; }); child.on('error', reject); child.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(`git ${args[0]} failed: ${stderr.trim()}`))); }); }
