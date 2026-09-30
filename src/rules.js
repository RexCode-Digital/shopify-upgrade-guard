import { isAtOrAfter, statusFor, latestStable, becomesUnsupportedBefore } from './versions.js';

const checkoutDeprecation = '2026-07';
export const rules = [
  {
    id: 'UG-CHECKOUT-001', surface: 'checkout_ui_extension', severity: 'warning', title: 'Buyer journey intercept is deprecated', deprecatedIn: checkoutDeprecation, confidence: 'high',
    documentationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions', migrationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions',
    description: 'useBuyerJourneyIntercept and buyerJourney.intercept are deprecated from Checkout UI extension version 2026-07. Migrate validation to a cart and checkout validation Function.',
    detect(file) { if (!/\.(?:[jt]sx?|graphql|gql)$/.test(file.relativePath)) return []; return matches(maskCommentsAndStrings(file.text), /\b(?:useBuyerJourneyIntercept|buyerJourney\.intercept)\b/g, 'Replace client-side blocking with a cart and checkout validation Function.'); },
    evaluate(match, context) { return versionAware(match, this, context); }
  },
  {
    id: 'UG-CHECKOUT-002', surface: 'checkout_ui_extension', severity: 'warning', title: 'Checkout block_progress capability is deprecated', deprecatedIn: checkoutDeprecation, confidence: 'high',
    documentationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions', migrationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions',
    description: 'The block_progress capability is deprecated from Checkout UI extension version 2026-07 and supports the deprecated buyer journey intercept API.',
    detect(file) { if (!file.relativePath.endsWith('shopify.extension.toml')) return []; return matches(maskTomlComments(file.text), /^\s*block_progress\s*=\s*(?:true|false)\s*$/gm, 'Move validation logic to a cart and checkout validation Function.'); },
    evaluate(match, context) { return versionAware(match, this, context); }
  },
  {
    id: 'UG-REST-001', surface: 'admin_rest_api', severity: 'warning', title: 'REST Admin API usage is legacy', confidence: 'high',
    documentationUrl: 'https://shopify.dev/docs/api/admin-rest', migrationUrl: 'https://shopify.dev/docs/api/admin-graphql',
    description: 'The REST Admin API is legacy. New public apps must use the GraphQL Admin API; existing integrations should plan migration where applicable.',
    detect(file) { if (!/\.(?:[jt]sx?|graphql|gql)$/.test(file.relativePath)) return []; const patterns = [/\/admin\/api\/(?:\d{4}-(?:0[147]|10)|latest|unstable)\/(?!graphql(?:\.json)?\b)/g]; if (/shopify/i.test(file.text)) patterns.push(/\b(?:restResources|Rest\s*Admin|adminRest)\b/g); const found = patterns.flatMap((pattern) => matches(file.text, pattern, 'Prefer the GraphQL Admin API for new work and plan migration for this REST integration.')); return found.length ? [found[0]] : []; },
    evaluate(match) { return { ...match, classification: 'current', reason: this.description }; }
  },
  {
    id: 'UG-VERSION-001', surface: 'versioned_api', severity: 'error', title: 'Shopify API version is unsupported', confidence: 'high',
    documentationUrl: 'https://shopify.dev/docs/api/usage/versioning', description: 'Shopify may fall forward when a request targets an inaccessible version. Pin to a supported stable version and test the migration.',
    detect() { return []; },
    evaluate(match, context) { const currentStatus = statusFor(match.version); const targetRisk = becomesUnsupportedBefore(match.version, context.targetVersion); if (currentStatus !== 'unsupported' && !targetRisk) return null; return { ...match, classification: currentStatus === 'unsupported' ? 'current' : 'target', reason: currentStatus === 'unsupported' ? this.description : `This version becomes inaccessible by target ${context.targetVersion}. ${this.description}` }; }
  },
  {
    id: 'UG-VERSION-002', surface: 'versioned_api', severity: 'info', title: 'Shopify API version is not the latest stable', confidence: 'high',
    documentationUrl: 'https://shopify.dev/docs/api/usage/versioning', description: `The latest bundled stable version is ${latestStable.version}. Older supported versions remain usable, but quarterly upgrades reduce migration risk.`,
    detect() { return []; },
    evaluate(match) { if (statusFor(match.version) === 'stable' && match.version !== latestStable.version) return { ...match, classification: 'current', reason: this.description }; return null; }
  }
];

export function ruleById(id) { return rules.find((rule) => rule.id === id); }
function versionAware(match, rule, context) {
  const current = context.inventory.find((item) => item.surface === 'checkout_ui_extension')?.version;
  const currentAffected = current && isAtOrAfter(current, rule.deprecatedIn);
  const targetAffected = isAtOrAfter(context.targetVersion, rule.deprecatedIn);
  if (!currentAffected && !targetAffected) return null;
  return { ...match, classification: currentAffected ? 'current' : 'target', reason: currentAffected ? rule.description : `This API becomes deprecated before target ${context.targetVersion}. ${rule.description}` };
}
function matches(text, pattern, guidance) { return [...text.matchAll(pattern)].map((match) => { const before = text.slice(0, match.index); return { file: null, line: before.split('\n').length, column: match.index - before.lastIndexOf('\n'), snippet: match[0], guidance }; }); }
export function attachFile(matchesForFile, file) { return matchesForFile.map((match) => ({ ...match, file: file.relativePath })); }
function maskCommentsAndStrings(text) { return text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|(['"`])(?:\\.|(?!\1)[^\\])*\1/g, (value) => value.replace(/[^\n]/g, ' ')); }
function maskTomlComments(text) { return text.replace(/#[^\n]*/g, (value) => value.replace(/[^\n]/g, ' ')); }
