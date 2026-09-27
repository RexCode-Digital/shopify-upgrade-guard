import versionData from '../data/versions.json' with { type: 'json' };
export const VERSION_SOURCE = versionData.source;
export const versions = versionData.versions;
export const latestStable = versions.find((item) => item.status === 'latest-stable');
export function parseVersion(value) { return typeof value === 'string' && /^(\d{4})-(0[1-9]|1[0-2])$/.test(value) ? value : null; }
export function statusFor(value) { const parsed = parseVersion(value); return parsed ? (versions.find((item) => item.version === parsed)?.status ?? 'unknown/future') : 'unknown'; }
export function versionSummary() { return versions; }
