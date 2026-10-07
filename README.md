# Shopify Upgrade Guard

**Catch documented Shopify API and platform upgrade risks before they become production migrations.**

[![npm](https://img.shields.io/npm/v/shopify-upgrade-guard?logo=npm)](https://www.npmjs.com/package/shopify-upgrade-guard)
[![npm downloads](https://img.shields.io/npm/dm/shopify-upgrade-guard?logo=npm)](https://www.npmjs.com/package/shopify-upgrade-guard)
[![CI](https://github.com/RexCode-Digital/shopify-upgrade-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/RexCode-Digital/shopify-upgrade-guard/actions/workflows/ci.yml)
[![CodeQL](https://github.com/RexCode-Digital/shopify-upgrade-guard/actions/workflows/codeql.yml/badge.svg)](https://github.com/RexCode-Digital/shopify-upgrade-guard/actions/workflows/codeql.yml)
[![license](https://img.shields.io/github/license/RexCode-Digital/shopify-upgrade-guard)](LICENSE)

Shopify Upgrade Guard is an offline, evidence-backed CLI and GitHub Action for Shopify developers. It scans a repository for documented upgrade and deprecation risks, evaluates them against a target Shopify API version, and gives you migration guidance backed by official Shopify sources.

**No Shopify credentials. No telemetry. No source upload. No repository code execution.**

> Unofficial open-source developer tooling. Not affiliated with, endorsed by, or certified by Shopify.

Maintained by RexCode Digital Ltd.

Part of the **RexCode Shopify developer tools** suite. Requires Node.js 20 or later for the CLI. [Releases](https://github.com/RexCode-Digital/shopify-upgrade-guard/releases) · [npm](https://www.npmjs.com/package/shopify-upgrade-guard) · [Marketplace](https://github.com/marketplace/actions/shopify-upgrade-guard)

## Quick start

Run it without installing anything globally:

```bash
npx shopify-upgrade-guard scan --target 2026-10
```

Or install it in a project:

```bash
npm install --save-dev shopify-upgrade-guard
npx shopify-upgrade-guard scan --target 2026-10
```

Upgrade Guard separates **current debt** from **target-version blockers**, so teams can see what already exists and what becomes relevant for the migration they are planning.

## Why Upgrade Guard?

- **Target-aware** — evaluate findings against the Shopify version you actually plan to adopt.
- **Evidence-backed** — Shopify-specific rules link to official Shopify documentation or changelog evidence.
- **PR-aware** — distinguish newly introduced findings from pre-existing debt.
- **Baseline-friendly** — adopt the tool without forcing a big-bang cleanup of historical findings.
- **CI-ready** — human, JSON, and SARIF output plus a GitHub Action.
- **Offline by default** — ordinary scans require no network access, Shopify token, or store access.
- **Deterministic** — designed for repeatable CI results and reviewable rule behaviour.

## GitHub Action

A minimal pull-request gate:

```yaml
name: Shopify Upgrade Guard

on:
  pull_request:

permissions:
  contents: read

jobs:
  upgrade-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: RexCode-Digital/shopify-upgrade-guard@223ec33e119f920ecc9f9a5df722a2f6fda0df40 # v0.2.5
        with:
          target: 2026-10
          fail-on: warning
          fail-on-new: 'true'
```

Use the immutable patch release tag or a reviewed full commit SHA. Existing minor aliases are retained for compatibility and are not moved by future releases.

### Action inputs

| Input | Purpose |
| --- | --- |
| `target` | Shopify target version, for example `2026-10` |
| `fail-on` | Policy threshold: `never`, `error`, `warning`, or `info` |
| `fail-on-new` | Apply the failure threshold only to findings introduced by the PR |
| `path` | Repository path to scan |
| `base-ref` | Explicit Git base for comparison; defaults to origin/PR-base for new-only pull-request checks |

### Action outputs

`outcome`, `finding-count`, `new-finding-count`, `error-count`, `current-versions`, and `result-json`.

The Action is bundled and runs on the current GitHub `node24` JavaScript Action runtime.

## What it catches today

The rule pack is intentionally focused. Literal GraphQL checks parse supported documents and ignore malformed or dynamic queries; rule-specific context limits findings to Shopify API constructs that can be identified deterministically.

| Rule | Detects | Evidence |
| --- | --- | --- |
| `UG-CHECKOUT-001` | `useBuyerJourneyIntercept` / `buyerJourney.intercept` | [Shopify changelog](https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions) |
| `UG-CHECKOUT-002` | Checkout `block_progress` capability | [Shopify changelog](https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions) |
| `UG-REST-001` | Legacy Admin REST usage | [REST Admin API](https://shopify.dev/docs/api/admin-rest) |
| `UG-VERSION-001` | Unsupported or target-retiring API versions | [API versioning](https://shopify.dev/docs/api/usage/versioning) |
| `UG-VERSION-002` | Supported versions older than the latest stable version | [API versioning](https://shopify.dev/docs/api/usage/versioning) |
| `UG-CUSTOMER-001` | Customer Account checkout removals relevant to 2026-10 | [Shopify changelog](https://shopify.dev/changelog/customer-account-api-last-incomplete-checkout-and-checkout-types-removed) |
| `UG-POS-001` | Removed POS `session.currentSession.staffMemberId` usage | [Shopify changelog](https://shopify.dev/changelog/removed-session-currentsession-staffmemberid-from-pos-ui-extensions-2026-10) |
| `UG-ADMIN-001` | Legacy Admin GraphQL `priceRule` usage | [2026-10 release notes](https://shopify.dev/release-notes/2026-10) |
| `UG-ADMIN-002` | Literal GraphQL root `automaticDiscounts` removed in 2027-01 | [Official removal](https://shopify.dev/changelog/posts/automaticdiscounts-query-is-removed-in-api-version-2027-01) |
| `UG-ADMIN-003` | GraphQL `metafieldInteger` collection conditions and types removed in 2027-01 | [Official removal](https://shopify.dev/changelog/posts/metafieldinteger-collection-condition-removed-in-api-version-2027-01) |
| `UG-ADMIN-004` | `ProductVariant.barcode` read deprecated in 2026-10; it still works and no removal date is announced | [Official deprecation](https://shopify.dev/changelog/posts/product-variant-barcode-is-being-replaced-by-barcodes) |
| `UG-SEGMENT-001` | Legacy function/date syntax inside literal segment GraphQL query arguments | [Official syntax update](https://shopify.dev/changelog/posts/updated-function-syntax-on-the-segment-query-language) |
| `UG-ADMIN-005` | Source handling for removed inventory error `ITEM_NOT_STOCKED_AT_LOCATION` | [Official removal](https://shopify.dev/changelog/posts/removal-of-itemnotstockedatlocation-error) |
| `UG-SCRIPT-001` | Cross-version Script Tag write restrictions; REST resource references require method review | [Script Tag deprecation](https://shopify.dev/changelog/online-store-script-tags-deprecation) |

Supported inventory surfaces include Admin REST, Admin GraphQL, Checkout UI extensions, Customer Account UI extensions, POS UI extensions, Functions, Shopify app TOML, and recognized Shopify client configuration.

## CLI

```text
shopify-upgrade-guard scan [--target YYYY-MM] [--format human|json|sarif] [--fail-on ...] [--fail-on-new]
shopify-upgrade-guard baseline create|check [--path DIR]
shopify-upgrade-guard rules
shopify-upgrade-guard versions
shopify-upgrade-guard explain UG-CHECKOUT-001
```

Examples:

```bash
# Human-readable scan
npx shopify-upgrade-guard scan --target 2026-10

# CI-friendly JSON
npx shopify-upgrade-guard scan --target 2026-10 --format json

# SARIF for code-scanning workflows
npx shopify-upgrade-guard scan --target 2026-10 --format sarif

# Fail only when the PR introduces new warning-or-higher findings
npx shopify-upgrade-guard scan --target 2026-10 --fail-on warning --fail-on-new --base-ref origin/main
```

Exit codes: `0` means the scan completed and policy passed; `1` means active findings exceeded the configured policy; `2` means the scanner could not complete.

## Adopt it gradually with a baseline

Existing migration debt should not prevent a team from adopting Upgrade Guard.

```bash
npx shopify-upgrade-guard baseline create
npx shopify-upgrade-guard baseline check
```

Baselined findings remain reviewable while new fingerprints stay actionable.

`--fail-on-new` requires a valid Git base comparison. Fetch full history and provide `--base-ref`, or use the pull-request Action. Missing refs/history exit 2 instead of passing an incomplete comparison.

The bundled snapshot, verified 4 October 2026, lists `2026-10` as latest stable and `2027-01` as release candidate. The RC is for testing. Shopify lists `2025-10` as unsupported while its accessibility table runs until 16 October 2026; support status and accessibility are distinct. Future version names do not imply verified rule coverage.

## Configuration

Commit `.upgradeguard.json` to set repository defaults:

```json
{
  "targetVersion": "2026-10",
  "failOn": "warning",
  "exclude": ["fixtures/**"]
}
```

`exclude` accepts repository-relative glob patterns. Absolute paths and traversal are rejected.

See [examples](examples/) for copy-paste CI and configuration examples.

## Security and privacy

Upgrade Guard treats scanned repositories as untrusted input.

Ordinary scans:

- do not execute repository code
- do not contact Shopify
- do not require Shopify credentials
- do not upload source
- skip generated/vendor directories by default
- use bounded file discovery

See [SECURITY.md](SECURITY.md) and the [threat model](docs/threat-model.md).

## Related Shopify developer tools

Building or maintaining Shopify apps?

- **[ChangeGuard](https://github.com/RexCode-Digital/shopify-app-changeguard)** — Review meaningful `shopify.app*.toml` configuration changes before they reach production.
- **[Shopify Scope Guard](https://github.com/RexCode-Digital/shopify-scope-guard)** — Audit whether declared Shopify permissions are supported by offline code evidence.
- **[Shopify App Review Guard](https://github.com/RexCode-Digital/shopify-app-review-guard)** — Run deterministic preflight checks for Shopify App Store and production readiness.

GitHub Marketplace: [Shopify Upgrade Guard](https://github.com/marketplace/actions/shopify-upgrade-guard)

All four tools run offline and require no Shopify credentials.

## Contributing

Contributions are welcome, especially new evidence-backed Shopify migration rules and scanner hardening.

A Shopify-specific rule should include:

1. an official `shopify.dev` evidence URL
2. the affected version or status
3. bounded deterministic detection
4. migration guidance
5. positive and false-positive tests

Start with [the contribution guide](CONTRIBUTING.md) or browse the [open issues](https://github.com/RexCode-Digital/shopify-upgrade-guard/issues).

## Roadmap

Current priorities include additional verified Shopify breaking-change coverage, better PR base-tree classification, high-confidence Functions/Customer Account/POS/GraphQL rules, and maintainable GraphQL deprecation evidence.

See [ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).

## Immutable SHA usage

The Action example pins the reviewed v0.2.3 release commit. Verify the release reference with:

```bash
gh api repos/RexCode-Digital/shopify-upgrade-guard/git/ref/tags/v0.2.5 --jq .object.sha
```

Published patch tags and existing minor aliases are retained. Future releases do not move minor aliases; use an immutable patch tag or a reviewed full commit SHA.

The Action `base-ref` input selects an explicit Git comparison base. With `fail-on-new: true`, pull-request events default to `origin/<base branch>`; other events must supply `base-ref`. Ordinary scans do not infer a comparison from GitHub environment variables.
