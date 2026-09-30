# Shopify Upgrade Guard

Shopify Upgrade Guard detects documented Shopify platform/API upgrade risks in your repository before they become production migrations.

> Unofficial open-source developer tooling. Not affiliated with, endorsed by, or certified by Shopify.

This repository contains the `0.2.1` hotfix release. It is an offline, evidence-backed scanner for Shopify platform and API upgrade risks.

## Try it locally

```bash
git clone https://github.com/efegokdemir/shopify-upgrade-guard.git
cd shopify-upgrade-guard
npm ci
npm run build:action
node src/cli.js scan --path /path/to/shopify-app --target 2026-10
```

The scan is offline, read-only, deterministic, and uses bundled Shopify release evidence. `--target` changes rule evaluation: target-only risks are reported as upgrade blockers, while existing debt is reported separately.

## GitHub Action

Pin the Action to a reviewed commit SHA in production:

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@<immutable-sha>
  - uses: efegokdemir/shopify-upgrade-guard@<immutable-sha>
    with:
      target: 2026-10
      fail-on: warning
```

Inputs: `target`, `fail-on` (`never`, `error`, `warning`, or `info`), `fail-on-new`, and `path`.

Outputs: `outcome`, `finding-count`, `new-finding-count`, `error-count`, `current-versions` (the structured inventory), and `result-json`.

The Action uses the current GitHub `node24` JavaScript Action runtime. Consumers do not install dependencies.

## CLI

```text
node src/cli.js scan [--target YYYY-MM] [--format human|json|sarif] [--fail-on ...] [--fail-on-new]
node src/cli.js baseline create|check [--path DIR]
node src/cli.js rules
node src/cli.js versions
node src/cli.js explain UG-CHECKOUT-001
```

Exit codes: `0` means the scan completed and the policy passed; `1` means active findings exceeded the policy; `2` means the scanner could not complete.

## Configuration

Commit `.upgradeguard.json` to set repository defaults:

```json
{
  "targetVersion": "2026-10",
  "failOn": "warning",
  "exclude": ["fixtures/**"]
}
```

`exclude` accepts repository-relative glob patterns. Absolute paths and traversal are rejected. `baseline` writes `.upgradeguard-baseline.json`; baselined findings remain visible in JSON but do not fail policy, and new fingerprints remain actionable.

## Rules and evidence

The initial pack is deliberately small and high-precision. Every finding includes an official source, affected version metadata where applicable, location, confidence, and migration guidance.

| ID | Detection | Official evidence |
| --- | --- | --- |
| UG-CHECKOUT-001 | `useBuyerJourneyIntercept` / `buyerJourney.intercept` in JS/TS | [Shopify changelog](https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions) |
| UG-CHECKOUT-002 | `block_progress` in an extension TOML | [Shopify changelog](https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions) |
| UG-REST-001 | Versioned REST Admin URL or explicit REST client marker | [REST Admin API](https://shopify.dev/docs/api/admin-rest) |
| UG-VERSION-001 | Unsupported or target-retiring version in the inventory | [API versioning](https://shopify.dev/docs/api/usage/versioning) |
| UG-VERSION-002 | Supported version older than latest stable | [API versioning](https://shopify.dev/docs/api/usage/versioning) |
| UG-CUSTOMER-001 | Customer Account checkout fields/types removed in 2026-10 | [Shopify changelog](https://shopify.dev/changelog/customer-account-api-last-incomplete-checkout-and-checkout-types-removed) |
| UG-POS-001 | Removed POS `session.currentSession.staffMemberId` | [Shopify changelog](https://shopify.dev/changelog/removed-session-currentsession-staffmemberid-from-pos-ui-extensions-2026-10) |
| UG-ADMIN-001 | Legacy Admin GraphQL `priceRule` usage | [2026-10 release notes](https://shopify.dev/release-notes/2026-10) |
| UG-SCRIPT-001 | Script Tag create/update usage | [Script Tag deprecation](https://shopify.dev/changelog/online-store-script-tags-deprecation) |

Supported inventory surfaces currently include Admin REST, Admin GraphQL, Checkout UI extensions, Customer Account UI extensions, POS UI extensions, Functions, Shopify app TOML, and recognized Shopify client configuration.

## Security and privacy

No telemetry, Shopify credentials, store access, or network access is required for ordinary scans. The tool reads bounded repository files, skips generated/vendor directories, does not execute repository code, and does not upload source. See [the threat model](docs/threat-model.md).

## Roadmap and limitations

GraphQL schema-wide deprecation validation and exact base-tree resolved-finding reconstruction require additional maintained evidence and are not claimed as implemented. See [ROADMAP.md](ROADMAP.md).
