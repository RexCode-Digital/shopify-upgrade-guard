import { statusFor, latestStable } from './versions.js';
const common = { confidence: 'high' };
export const rules = [
  {
    id: 'UG-CHECKOUT-001', surface: 'checkout_ui_extension', severity: 'warning', title: 'Buyer journey intercept is deprecated', introducedIn: '2026-07',
    documentationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions', migrationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions',
    description: 'useBuyerJourneyIntercept and buyerJourney.intercept are deprecated from Checkout UI extension version 2026-07. Migrate validation to a cart and checkout validation Function.', ...common,
    detect(file) { if (!/\.(?:[jt]sx?|graphql|gql)$/.test(file.relativePath)) return []; return matches(file, /\b(?:useBuyerJourneyIntercept|buyerJourney\.intercept)\b/g, 'Replace client-side blocking with a cart and checkout validation Function.'); }
  },
  {
    id: 'UG-CHECKOUT-002', surface: 'checkout_ui_extension', severity: 'warning', title: 'Checkout block_progress capability is deprecated', introducedIn: '2026-07',
    documentationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions', migrationUrl: 'https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions',
    description: 'The block_progress capability is deprecated from Checkout UI extension version 2026-07 and supports the deprecated buyer journey intercept API.', ...common,
    detect(file) { if (!file.relativePath.endsWith('shopify.extension.toml') || !/\bblock_progress\b/.test(file.text)) return []; return matches(file, /\bblock_progress\b/g, 'Move validation logic to a cart and checkout validation Function.'); }
  },
  {
    id: 'UG-REST-001', surface: 'admin_rest_api', severity: 'warning', title: 'REST Admin API usage is legacy',
    documentationUrl: 'https://shopify.dev/docs/api/admin-rest', migrationUrl: 'https://shopify.dev/docs/api/admin-graphql',
    description: 'The REST Admin API is legacy. New public apps must use the GraphQL Admin API; existing integrations should plan migration where applicable.', ...common,
    detect(file) { if (!/\.(?:[jt]sx?|graphql|gql)$/.test(file.relativePath)) return []; return [/\/admin\/api\/(?:\d{4}-\d{2}|latest|unstable)\/(?!graphql(?:\.json)?\b)/g, /\b(?:restResources|Rest\s*Admin|adminRest)\b/g].flatMap((pattern) => matches(file, pattern, 'Prefer the GraphQL Admin API for new work and plan migration for this REST integration.')); }
  },
  {
    id: 'UG-VERSION-001', surface: 'versioned_api', severity: 'error', title: 'Shopify API version is unsupported',
    documentationUrl: 'https://shopify.dev/docs/api/usage/versioning', description: 'Shopify may fall forward when a request targets an inaccessible version. Pin to a supported stable version and test the migration.', ...common,
    detect(file) { const pattern = /(?:\/admin\/api\/|api_version\s*[=:]\s*|apiVersion\s*[=:]\s*|version\s*[=:]\s*)["'`]?((?:20\d{2})-(?:0[1-9]|1[0-2]))/g; return matches(file, pattern, 'Update this target to a supported stable Shopify API version.', (match) => statusFor(match[1]) === 'unsupported'); }
  },
  {
    id: 'UG-VERSION-002', surface: 'versioned_api', severity: 'info', title: 'Shopify API version is not the latest stable',
    documentationUrl: 'https://shopify.dev/docs/api/usage/versioning', description: `The latest bundled stable version is ${latestStable.version}. Older supported versions remain usable, but quarterly upgrades reduce migration risk.`, ...common,
    detect(file) { const pattern = /(?:\/admin\/api\/|api_version\s*[=:]\s*|apiVersion\s*[=:]\s*|version\s*[=:]\s*)["'`]?((?:20\d{2})-(?:0[1-9]|1[0-2]))/g; return matches(file, pattern, `Review this version against the latest stable ${latestStable.version}.`, (match) => statusFor(match[1]) === 'stable' && match[1] !== latestStable.version); }
  }
];
function matches(file, pattern, guidance, predicate = () => true) {
  return [...file.text.matchAll(pattern)].filter(predicate).map((match) => { const before = file.text.slice(0, match.index); return { line: before.split('\n').length, column: match.index - before.lastIndexOf('\n'), snippet: match[0], guidance }; });
}
