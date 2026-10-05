# Changelog

## 0.2.5

- Refine npm search metadata and the Action description for target-aware Shopify API upgrade checks.

## 0.2.4

- Refresh published npm metadata to the canonical RexCode-Digital repository and issue tracker.
- Preserve the existing package name, license, author attribution, and runtime behavior.

## 0.2.3

- Correct ScriptTag write restrictions across API targets and add the documented automaticDiscounts removal in 2027-01.
- Fail on invalid options and unavailable Git comparisons; make baseline checks honor accepted findings.
- Reject unsafe config/baseline paths, bound file analysis, and include named Shopify configurations.
- Preserve Node 20 compatibility, validate standalone bundles and clean packages, and report source-only coverage.

## 0.2.2 - 2026-10-01

- Updated the official Shopify version registry: 2026-10 is now latest stable and 2026-07 is stable.
- Re-audited the 2026-10 release changes; no additional deterministic static rule was added because the remaining changes require schema or runtime context.

## 0.2.1 - 2026-09-30

- Fixed npm release packaging so runtime dependencies remain empty and fresh public-registry installs are verified before release completion.
- Pinned the release workflow to npm 11.15.0 and added package metadata and registry-install safeguards.
- Preserved all v0.2.0 scanner behavior, rule IDs, exit codes, severity behavior, and GitHub Action functionality.

## 0.2.0 - 2026-09-30

- Added evidence-backed target-aware checks for Customer Account checkout removals, POS staff member access, legacy GraphQL `priceRule` usage, and Script Tag create/update migration.
- Added stable finding lifecycles and `--fail-on-new` policy support for CLI and GitHub Action workflows.
- Added baseline create/check commands, deterministic SARIF fingerprints, and the GitHub Action `new-finding-count` output.
- Preserved existing rule IDs, exit codes, severity behavior, and the v0.1 configuration model.

Sources: [Shopify API versioning](https://shopify.dev/docs/api/usage/versioning), [2026-10 release notes](https://shopify.dev/release-notes/2026-10), [Script Tag deprecation](https://shopify.dev/changelog/online-store-script-tags-deprecation).

## 0.1.0 - 2026-09-27

- Initial offline scanner, evidence-backed rule pack, CLI formats, and GitHub Action metadata.
