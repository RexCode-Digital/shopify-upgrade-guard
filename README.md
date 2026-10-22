# Shopify Upgrade Guard

Find evidence-backed Shopify API and platform migration risks against a target version.

**RexCode Open Source · Shopify developer tools**

[![npm](https://img.shields.io/npm/v/shopify-upgrade-guard?logo=npm)](https://www.npmjs.com/package/shopify-upgrade-guard)
[![CI](https://github.com/RexCode-Digital/shopify-upgrade-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/RexCode-Digital/shopify-upgrade-guard/actions/workflows/ci.yml)
[![CodeQL](https://github.com/RexCode-Digital/shopify-upgrade-guard/actions/workflows/codeql.yml/badge.svg)](https://github.com/RexCode-Digital/shopify-upgrade-guard/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/RexCode-Digital/shopify-upgrade-guard/badge)](https://securityscorecards.dev/viewer/?uri=github.com/RexCode-Digital/shopify-upgrade-guard)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22+-22B8B2?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MIT licence](https://img.shields.io/github/license/RexCode-Digital/shopify-upgrade-guard)](LICENSE)

Shopify Upgrade Guard scans local application source and configuration for documented API removals, deprecations and platform changes. Each finding includes a version boundary and an official source where available.

## Features

- Checks migration risks against an explicit Shopify API target.
- Separates current debt from target-version findings.
- Supports JSON and SARIF output, baselines and pull-request-only findings.
- Keeps rules deterministic and links Shopify-specific checks to official evidence.

## Install and run

Requires Node.js 22 or later.

```bash
npm install --save-dev shopify-upgrade-guard
npx shopify-upgrade-guard scan --target 2026-10
```

Use `npx shopify-upgrade-guard --help` for all commands. See the [CLI guide](docs/cli.md) and [version model](docs/version-model.md).

## GitHub Action

Pin the released v0.4.0 commit:

```yaml
name: Check Shopify API migration
on: [pull_request]
permissions:
  contents: read

jobs:
  upgrade-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          fetch-depth: 0
      - uses: RexCode-Digital/shopify-upgrade-guard@71f9cdca7d0b34b07c1dfb60c2dc649e2e595139 # v0.4.0
        with:
          target: 2026-10
          fail-on: warning
```

Inputs are `target`, `fail-on`, `fail-on-new`, `base-ref` and `path`. Outputs include active/new/resolved finding counts, error count, version inventory, policy outcome and JSON results. See [action.yml](action.yml).

## Example output

```text
Shopify Upgrade Guard
Target version: 2026-10
Files scanned: 1

ERROR  UG-CUSTOMER-001
Customer Account checkout types are removed
  customer.graphql:1
  This usage is affected by target 2026-10.
  Migration: Use Storefront cart flows or Customer.orders as appropriate.
  Source: https://shopify.dev/changelog/customer-account-api-last-incomplete-checkout-and-checkout-types-removed

1 active risk found
Result: migration recommended
```

The example is shortened from a scan of a synthetic GraphQL document.

## Supported capabilities and evidence

Rules cover documented Shopify API and platform lifecycle changes across supported Admin GraphQL, Customer Account, Checkout UI, POS, extension-configuration and other tracked surfaces. Each rule defines its affected version and migration guidance; the [CLI guide](docs/cli.md), generated rule catalogue from the rules command, and [migration documentation](docs/2027-01-migration.md) describe current coverage. Rules only apply at their documented version boundary.

The source branch also contains the proposed `UG-TAX-001` check for an explicit `tax_summaries/create` subscription and target `2027-01`. It is not part of the published v0.4.0 package or Action. See the [2027-01 research and limits](docs/2027-01-migration.md).

## Limitations and privacy

Scans are offline and do not call Shopify or execute application code. A match is a review signal, not proof of a production failure. Static detection cannot see runtime-generated operations, every framework wrapper, live subscription configuration or whether application code already handles a changed payload. Review the linked source and test the migration in your application.

## Documentation

- [Getting started](docs/getting-started.md)
- [CLI and rule behaviour](docs/cli.md)
- [Configuration and baselines](docs/configuration.md)
- [2027-01 migration research](docs/2027-01-migration.md)
- [Release process](docs/release-process.md)

## Related RexCode OSS tools

- [ChangeGuard](https://github.com/RexCode-Digital/shopify-app-changeguard) reviews semantic app configuration changes.
- [Shopify Scope Guard](https://github.com/RexCode-Digital/shopify-scope-guard) checks requested access scopes against static evidence.
- [Shopify App Review Guard](https://github.com/RexCode-Digital/shopify-app-review-guard) reports App Store and production-readiness evidence.

Use the [four-tool workflow](https://github.com/RexCode-Digital/shopify-app-changeguard/blob/main/docs/ecosystem-workflow.md) to run the published Actions together.

## Contributing and support

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [RexCode Open Source standards](https://github.com/RexCode-Digital/.github/blob/main/docs/oss/standards.md). For usage questions or safe reproductions, use [SUPPORT.md](SUPPORT.md) or the [issue tracker](https://github.com/RexCode-Digital/shopify-upgrade-guard/issues).

## Security

Use [SECURITY.md](SECURITY.md) for private vulnerability reporting. Do not post credentials, merchant data or private source in public issues.

## Licence and affiliation

MIT licensed. Shopify's names and marks belong to Shopify. This independent open-source project is not affiliated with, endorsed by, or certified by Shopify.