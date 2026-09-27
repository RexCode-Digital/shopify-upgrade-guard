import versionData from '../data/versions.json' with { type: 'json' };

export const VERSION_SOURCE = versionData.source;
export const versions = Object.freeze(versionData.versions);
export const latestStable = versions.find((item) => item.status === 'latest-stable');
const quarterly = /^(\d{4})-(01|04|07|10)$/;

export function parseVersion(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(quarterly);
  return match ? `${match[1]}-${match[2]}` : null;
}
export function compareVersions(left, right) { const a = parseVersion(left); const b = parseVersion(right); if (!a || !b) throw new Error(`Cannot compare invalid Shopify versions: ${left}, ${right}`); return a === b ? 0 : a < b ? -1 : 1; }
export function isBefore(left, right) { return compareVersions(left, right) < 0; }
export function isAtOrAfter(left, right) { return compareVersions(left, right) >= 0; }
export function versionRecord(value) { const parsed = parseVersion(value); return parsed ? versions.find((item) => item.version === parsed) ?? null : null; }
export function statusFor(value) { const parsed = parseVersion(value); if (!parsed) return 'unknown'; return versionRecord(parsed)?.status ?? 'unknown/future'; }
export function isKnownVersion(value) { return Boolean(versionRecord(value)); }
export function targetRecord(value) { const parsed = parseVersion(value); if (!parsed) throw new Error(`Invalid target version: ${value}. Expected a quarterly YYYY-MM version (01, 04, 07, or 10).`); return versionRecord(parsed) ?? { version: parsed, status: 'unknown/future', accessibleUntil: null }; }
export function becomesUnsupportedBefore(version, target) { const record = versionRecord(version); const targetVersion = targetRecord(target); return Boolean(record?.accessibleUntil && record.accessibleUntil.slice(0, 7) <= targetVersion.version); }
export function versionSummary() { return versions; }
