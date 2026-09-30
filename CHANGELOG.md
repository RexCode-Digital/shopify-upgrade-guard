# Changelog

## 0.2.0 - 2026-09-30

- Added evidence-backed target-aware checks for Customer Account checkout removals, POS staff member access, legacy GraphQL `priceRule` usage, and Script Tag create/update migration.
- Added stable finding lifecycles and `--fail-on-new` policy support for CLI and GitHub Action workflows.
- Added baseline create/check commands, deterministic SARIF fingerprints, and the GitHub Action `new-finding-count` output.
- Preserved existing rule IDs, exit codes, severity behavior, and the v0.1 configuration model.

Sources: [Shopify API versioning](https://shopify.dev/docs/api/usage/versioning), [2026-10 release notes](https://shopify.dev/release-notes/2026-10), [Script Tag deprecation](https://shopify.dev/changelog/online-store-script-tags-deprecation).

## 0.1.0 - 2026-09-27

- Initial offline scanner, evidence-backed rule pack, CLI formats, and GitHub Action metadata.
