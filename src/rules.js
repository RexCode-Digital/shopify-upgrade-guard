import { isAtOrAfter, statusFor, latestStable, becomesUnsupportedBefore } from './versions.js';

import { rootFieldMatches, fieldMatches } from './graphql.js';

const checkoutDeprecation = '2026-07';
const removalVersion = '2026-10';
const sourceExtensions = /\.(?:[jt]sx?|graphql|gql)$/;
export const rules = [
  {
    id: 'UG-CHECKOUT-001', surface: 'checkout_ui_extension', severity: 'warning', title: 'Buyer journey intercept is deprecated', deprecatedIn: checkoutDeprecation, confidence: 'high',
    documentationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions', migrationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions',
    description: 'useBuyerJourneyIntercept and buyerJourney.intercept are deprecated from Checkout UI extension version 2026-07. Migrate validation to a cart and checkout validation Function.',
    detect(file) { if (!sourceExtensions.test(file.relativePath)) return []; return matches(maskCommentsAndStrings(file.text), /\b(?:useBuyerJourneyIntercept|buyerJourney\.intercept)\b/g, 'Replace client-side blocking with a cart and checkout validation Function.'); },
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
    id: 'UG-CUSTOMER-001', surface: 'customer_account_api', severity: 'error', title: 'Customer Account checkout types are removed', removedIn: removalVersion, confidence: 'high',
    documentationUrl: 'https://shopify.dev/changelog/customer-account-api-last-incomplete-checkout-and-checkout-types-removed', migrationUrl: 'https://shopify.dev/changelog/customer-account-api-last-incomplete-checkout-and-checkout-types-removed',
    description: 'Customer.lastIncompleteCheckout and the Checkout type subtree are removed in API version 2026-10 with no replacement. Use Storefront cart flows or Customer.orders as appropriate.',
    detect(file) { if (!sourceExtensions.test(file.relativePath)) return []; return fieldMatches(file, ['lastIncompleteCheckout'], ['Checkout'], 'Remove the Customer Account checkout field/type usage and migrate to Storefront cart flows or Customer.orders.'); },
    evaluate(match, context) { return removalAware(match, this, context); }
  },
  {
    id: 'UG-POS-001', surface: 'pos_ui_extension', severity: 'error', title: 'POS currentSession.staffMemberId is removed', removedIn: removalVersion, confidence: 'high',
    documentationUrl: 'https://shopify.dev/changelog/removed-session-currentsession-staffmemberid-from-pos-ui-extensions-2026-10', migrationUrl: 'https://shopify.dev/changelog/removed-session-currentsession-staffmemberid-from-pos-ui-extensions-2026-10',
    description: 'session.currentSession.staffMemberId is removed from POS UI Extensions in API version 2026-10. Use session.staffMember.value?.id or subscribe to staffMember.',
    detect(file) { if (!/\.(?:[jt]sx?)$/.test(file.relativePath)) return []; return matches(maskComments(file.text), /\bsession\.currentSession\.staffMemberId\b/g, 'Use session.staffMember.value?.id or subscribe to the staffMember signal.'); },
    evaluate(match, context) { return removalAware(match, this, context); }
  },
  {
    id: 'UG-ADMIN-001', surface: 'admin_graphql_api', severity: 'warning', title: 'Legacy GraphQL priceRule field is removed', removedIn: removalVersion, confidence: 'medium',
    documentationUrl: 'https://shopify.dev/changelog/release-notes/2026-10', migrationUrl: 'https://shopify.dev/changelog/release-notes/2026-10',
    description: 'Legacy priceRule fields and types are removed from the Admin GraphQL API in 2026-10. Use discountTitle or discountCode where applicable.',
    detect(file) { if (!sourceExtensions.test(file.relativePath)) return []; return fieldMatches(file, ['priceRule'], ['PriceRule'], 'For DraftOrderDiscountNotAppliedWarning, select discountTitle and discountCode instead; review other legacy PriceRule selections against the removed public types.'); },
    evaluate(match, context) { return removalAware(match, this, context); }
  },
  {
    id: 'UG-SCRIPT-001', surface: 'online_store_script_tags', severity: 'error', title: 'Script Tag creation and updates are deprecated', deprecatedIn: removalVersion, confidence: 'high',
    documentationUrl: 'https://shopify.dev/changelog/online-store-script-tags-deprecation', migrationUrl: 'https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation',
    description: 'ScriptTag create/update operations are restricted on all API versions from October 1, 2026 and storefront injection stops on March 1, 2027. Migrate to a theme app extension/app embed block or web pixel.',
    detect(file) { if (!sourceExtensions.test(file.relativePath)) return []; return matches(maskComments(file.text), /\b(?:scriptTagCreate|scriptTagUpdate|script_tags)\b/g, 'Migrate Script Tag injection to a theme app extension/app embed block or web pixel.'); },
    evaluate(match) { return { ...match, classification: 'current', reason: this.description, ...(match.snippet === 'script_tags' ? { severity: 'warning', confidence: 'medium', title: 'Script Tag REST usage requires migration review', reason: 'Script Tag POST/PUT are restricted across all API versions; reads and deletes remain available. Review the HTTP method and plan storefront injection migration.' } : {}) }; }
  },
  {
    id: 'UG-ADMIN-002', surface: 'admin_graphql_api', severity: 'error', title: 'automaticDiscounts query is removed', removedIn: '2027-01', confidence: 'high',
    documentationUrl: 'https://shopify.dev/changelog/posts/automaticdiscounts-query-is-removed-in-api-version-2027-01',
    migrationUrl: 'https://shopify.dev/docs/api/admin-graphql/2027-01/queries/discountNodes',
    description: 'The Admin GraphQL QueryRoot.automaticDiscounts field is removed in 2027-01. Migrate to discountNodes with a method:automatic filter.',
    detect(file) { return rootFieldMatches(file, 'automaticDiscounts', 'Use discountNodes(first: ..., query: "method:automatic") and move discount fragments under DiscountNode.discount.'); },
    evaluate(match, context) { return removalAware(match, this, context); }
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
function removalAware(match, rule, context) {
  if (!isAtOrAfter(context.targetVersion, rule.removedIn ?? rule.deprecatedIn)) return null;
  return { ...match, classification: 'target', reason: `This usage is affected by target ${context.targetVersion}. ${rule.description}` };
}
function matches(text, pattern, guidance) { return [...text.matchAll(pattern)].map((match) => { const before = text.slice(0, match.index); return { file: null, line: before.split('\n').length, column: match.index - before.lastIndexOf('\n'), snippet: match[0], guidance }; }); }
export function attachFile(matchesForFile, file) { return matchesForFile.map((match) => ({ ...match, file: file.relativePath })); }
function maskCommentsAndStrings(text) { return text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|(['"`])(?:\\.|(?!\1)[^\\])*\1/g, (value) => value.replace(/[^\n]/g, ' ')); }
function maskComments(text) { return text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (value) => value.replace(/[^\n]/g, ' ')); }
function maskTomlComments(text) { return text.replace(/#[^\n]*/g, (value) => value.replace(/[^\n]/g, ' ')); }
