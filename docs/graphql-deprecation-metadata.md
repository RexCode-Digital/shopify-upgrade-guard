# GraphQL deprecation metadata

## What Shopify publishes

Shopify publishes versioned Admin GraphQL API references and announces deprecations in its developer changelog. Its [versioning guide](https://shopify.dev/docs/api/usage/versioning) says API versions ship quarterly, stable versions are supported for at least 12 months, and deprecations are announced with migration guidance before removal in a later release.

Shopify's maintained [`@shopify/api-codegen-preset`](https://github.com/Shopify/shopify-app-js/blob/main/packages/api-clients/api-codegen-preset/README.md) uses version-specific schema URLs such as `https://shopify.dev/admin-graphql-direct-proxy/2025-01` as GraphQL Code Generator inputs. This documents a way to obtain a schema for a chosen version for code generation. We found no official compact deprecation feed or downloadable, versioned deprecation catalogue. A schema can expose deprecated members and reasons, but a schema alone does not establish the first affected version, removal version, replacement, or safe static matcher; those still need changelog and API-reference evidence.

## Redistribution

Shopify's [API Terms](https://www.shopify.com/legal/api-terms) define the Shopify APIs to include data structures and technical documentation, and restrict copying or creating derivative works of the APIs or any portion of them without written authorisation, subject to the terms' stated exceptions. The terms do not provide a clear grant to redistribute full schema snapshots or metadata derived from them. This is a licensing and provenance uncertainty, not a legal conclusion that every factual record is prohibited. Do not package schema dumps or automatically derived schema metadata without written permission or a clear licence review.

## Decision and maintenance cost

Upgrade Guard remains offline and keeps its small, manually reviewed set of high-confidence rules backed by official Shopify changelog or API-reference evidence. No schema download, Shopify credential, runtime network dependency, or third-party schema is needed. A broad metadata catalogue would require comparing versions, resolving when each change takes effect, linking replacements, and reviewing false positives every quarter; that adds maintenance without replacing the rule-specific evidence and bounded source matchers that make findings actionable.

If redistribution rights become clear and a catalogue demonstrates additional value, keep it data-only and limited to records like:

```json
{
  "apiVersion": "2026-10",
  "coordinate": "ProductVariant.barcode",
  "status": "deprecated",
  "deprecatedIn": "2026-10",
  "removedIn": null,
  "replacement": "ProductVariant.barcodes",
  "sourceUrl": "https://shopify.dev/changelog/posts/product-variant-barcode-is-being-replaced-by-barcodes",
  "checkedAt": "2026-10-22"
}
```

Store only the minimum version and coordinate facts needed by a rule, with an official source URL and verification date. Do not include schema definitions or copied descriptions. Review the official release notes and changelog each quarter and when Shopify announces a relevant change; retain only records with a deterministic matcher, migration guidance, positive fixtures, and false-positive coverage.
