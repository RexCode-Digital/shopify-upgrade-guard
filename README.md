# Shopify Upgrade Guard

Shopify Upgrade Guard detects documented Shopify platform/API upgrade risks in your repository before they become production migrations.

> Unofficial open-source developer tooling. Not affiliated with, endorsed by, or certified by Shopify.

## Quick start

```bash
npx shopify-upgrade-guard scan
npx shopify-upgrade-guard scan --target 2026-10 --fail-on warning
```

The default scan is offline, read-only, deterministic, and uses the bundled Shopify release evidence. It reports current repository debt; `--target` records the intended upgrade target for CI and future target-aware rules.

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

Inputs are `target`, `fail-on` (`never`, `error`, `warning`, or `info`), and `path`. Outputs are `outcome`, `finding-count`, `error-count`, `current-versions`, and `result-json`.

## Commands

```text
shopify-upgrade-guard scan [--target YYYY-MM] [--format human|json|sarif] [--fail-on ...]
shopify-upgrade-guard rules
shopify-upgrade-guard versions
shopify-upgrade-guard explain UG-CHECKOUT-001
```

Exit codes: `0` means the scan completed and the policy passed; `1` means findings exceeded `--fail-on`; `2` means the scanner could not complete.

## Rules and evidence

The initial rule pack is deliberately small and high-precision:

| ID | Detection | Official evidence |
| --- | --- | --- |
| UG-CHECKOUT-001 | `useBuyerJourneyIntercept` / `buyerJourney.intercept` in JS/TS | [Shopify changelog](https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions) |
| UG-CHECKOUT-002 | `block_progress` in an extension TOML | [Shopify changelog](https://shopify.dev/changelog/deprecating-the-usebuyerjourneyintercept-api-on-checkout-ui-extensions) |
| UG-REST-001 | Versioned REST Admin URL or explicit REST client marker | [REST Admin API](https://shopify.dev/docs/api/admin-rest) |
| UG-VERSION-001 | Explicit version known to be inaccessible | [API versioning](https://shopify.dev/docs/api/usage/versioning) |
| UG-VERSION-002 | Explicit supported version older than latest stable | [API versioning](https://shopify.dev/docs/api/usage/versioning) |

Every finding includes its source URL, file, line, confidence, and migration guidance. The scanner does not claim that every REST call is immediately broken, and it excludes generated/vendor directories by default.

## Configuration

Teams may commit a small `.upgradeguard.json`:

```json
{ "targetVersion": "2026-10", "failOn": "warning", "exclude": [] }
```

`targetVersion` is currently consumed. Additional fields are reserved for future releases and are not silently interpreted.

## Security and privacy

No telemetry, Shopify credentials, store access, or network access is required for ordinary scans. The tool reads repository files and never executes repository code. See [docs/threat-model.md](docs/threat-model.md).

## Status

This is an early `0.1.0` release. It is not a replacement for Shopify's app alerts, API schema validation, or runtime monitoring. See [ROADMAP.md](ROADMAP.md) and [docs/maintainer-release-process.md](docs/maintainer-release-process.md).
