# Shopify Upgrade Guard

**Catch documented Shopify API and platform upgrade risks before they become production migrations.**

[![npm](https://img.shields.io/npm/v/shopify-upgrade-guard?logo=npm)](https://www.npmjs.com/package/shopify-upgrade-guard)
[![npm downloads](https://img.shields.io/npm/dm/shopify-upgrade-guard?logo=npm)](https://www.npmjs.com/package/shopify-upgrade-guard)
[![CI](https://github.com/efegokdemir/shopify-upgrade-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/efegokdemir/shopify-upgrade-guard/actions/workflows/ci.yml)
[![CodeQL](https://github.com/efegokdemir/shopify-upgrade-guard/actions/workflows/codeql.yml/badge.svg)](https://github.com/efegokdemir/shopify-upgrade-guard/actions/workflows/codeql.yml)
[![license](https://img.shields.io/github/license/efegokdemir/shopify-upgrade-guard)](LICENSE)

Shopify Upgrade Guard is an offline, evidence-backed CLI and GitHub Action for Shopify developers. It scans a repository for documented upgrade and deprecation risks, evaluates them against a target Shopify API version, and gives you migration guidance backed by official Shopify sources.

**No Shopify credentials. No telemetry. No source upload. No repository code execution.**

> Unofficial open-source developer tooling. Not affiliated with, endorsed by, or certified by Shopify.

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
      - uses: actions/checkout@v4

      - uses: efegokdemir/shopify-upgrade-guard@v0.2.1
        with:
          target: 2026-10
          fail-on: warning
          fail-on-new: 'true'
```

For high-assurance production workflows, pin third-party Actions to a reviewed immutable commit SHA.

### Action inputs

| Input | Purpose |
| --- | --- |
| `target` | Shopify target version, for example `2026-10` |
| `fail-on` | Policy threshold: `never`, `error`, `warning`, or `info` |
| `fail-on-new` | Apply the failure threshold only to findings introduced by the PR |
| `path` | Repository path to scan |

### Action outputs

`outcome`, `finding-count`, `new-finding-count`, `error-count`, `current-versions`, and `result-json`.

The Action is bundled and runs on the current GitHub `node24` JavaScript Action runtime.

## What it catches today

The rule pack is intentionally small and high-precision.

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
| `UG-SCRIPT-001` | Script Tag create/update usage | [Script Tag deprecation](https://shopify.dev/changelog/online-store-script-tags-deprecation) |

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
npx shopify-upgrade-guard scan --target 2026-10 --fail-on warning --fail-on-new
```

Exit codes: `0` means the scan completed and policy passed; `1` means active findings exceeded the configured policy; `2` means the scanner could not complete.

## Adopt it gradually with a baseline

Existing migration debt should not prevent a team from adopting Upgrade Guard.

```bash
npx shopify-upgrade-guard baseline create
npx shopify-upgrade-guard baseline check
```

Baselined findings remain reviewable while new fingerprints stay actionable.

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

## Contributing

Contributions are welcome, especially new evidence-backed Shopify migration rules and scanner hardening.

A Shopify-specific rule should include:

1. an official `shopify.dev` evidence URL
2. the affected version or status
3. bounded deterministic detection
4. migration guidance
5. positive and false-positive tests

Start with [the contribution guide](CONTRIBUTING.md) or browse the [open issues](https://github.com/efegokdemir/shopify-upgrade-guard/issues).

## Roadmap

Current priorities include additional verified Shopify breaking-change coverage, better PR base-tree classification, high-confidence Functions/Customer Account/POS/GraphQL rules, and maintainable GraphQL deprecation evidence.

See [ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).
