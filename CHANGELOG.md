# Changelog

## Unreleased

- Add the target-aware `UG-TAX-001` review finding when a Shopify app config subscribes to `tax_summaries/create` and the scan targets API version 2027-01 or later. The warning identifies the affected integration but does not claim to prove numeric-ID assumptions in its handler.

## 0.4.0

- Add `UG-EXT-001` for missing `owner_type` in structurally parsed Checkout and Customer Account UI extension metafield declarations; report an optional migration warning for target `2026-10` and a deployment error from target `2027-01`.
- Extend `UG-ADMIN-002` to detect literal references to the removed `DiscountAutomaticConnection` and `DiscountAutomaticEdge` GraphQL types.
- Breaking: require Node.js 22 or newer for the CLI; Node.js 20 is no longer supported. The Action remains on Node.js 24, and CI retains the required Node.js 20 check alongside Node.js 22 and 24.
- Reverify the Shopify version registry on 21 October 2026; `2027-01` remains a release candidate and `2025-10` is now beyond its documented access cutoff.
- Retain GraphQL 16.14.2; the extension rule uses TOML parsing and does not depend on the separate open GraphQL 17 Dependabot change.

## 0.3.0

- Pin all CodeQL steps to the same immutable v4.38.3 commit to prevent mismatched init and analyze versions.
- Add target-aware checks for the removed 2027-01 market currency mutation and deprecated metaobject admin access input values.
- Compare findings from independent base and head trees, preserving rename status and reporting resolved findings.
- Evaluate API support against exact `accessibleUntil` timestamps and refresh the version registry through 14 October 2026.
- Document the 2027-01 tax Global ID migration as a manual review because numeric-ID assumptions cannot be established reliably from static code alone.
- Keep GraphQL 16 while Node.js 20 is supported, and document why generated deprecation metadata is not packaged without clear redistribution rights.

## 0.2.6

- Add bounded target-aware checks for the 2026-10 ProductVariant barcode deprecation, segment query syntax changes, and inventory error removal, plus 2027-01 metafieldInteger removal.

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
