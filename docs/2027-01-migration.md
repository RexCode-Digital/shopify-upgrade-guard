# Shopify API 2027-01 migration guide

Shopify's `2027-01` API is a release candidate for development testing as of 21 October 2026. Shopify's release notes list it as stable from 1 January 2027. Do not treat the release candidate as a production stable version.

## Extension metafield `owner_type`

Checkout and Customer Account UI extensions can add `owner_type` to metafield declarations from API version `2026-10`. Shopify requires it for each `[[extensions.metafields]]` and `[[extensions.targeting.metafields]]` declaration starting with `2027-01`. A deployment targeting `2027-01` or later is blocked if a declaration omits the property.

Upgrade Guard reports this as `UG-EXT-001` when a structurally parsed `shopify.extension.toml` contains a `type = "ui_extension"` extension with a Checkout or Customer Account target:

- For target `2026-10`, a missing property is a warning. It is optional in that version; add the correct resource owner before upgrading.
- For target `2027-01` or later, a missing property is an error because Shopify blocks deployment.
- Targets before `2026-10` are not reported because the property is not available there.

Choose the owner type from the resource that actually owns each metafield. Upgrade Guard does not infer it from `namespace`, `key`, the extension name, or the target. If one namespace/key pair refers to multiple resource types, Shopify's migration guidance calls for a separate declaration for each owner type.

The detector follows each extension's TOML structure. It checks global declarations only when that extension has an eligible target, and checks target-specific declarations only for the matching Checkout or Customer Account target. Other extension types and targets are ignored. Findings identify the relative TOML file and table-header line; they do not include the namespace or key.

```sh
shopify-upgrade-guard scan --target 2026-10
shopify-upgrade-guard scan --target 2027-01
```

`2027-01` is a release candidate, so use it for migration review and development testing. This check proves only that a supported static TOML declaration is missing the property; it does not validate that a chosen owner type is semantically correct. Malformed `shopify.extension.toml` input fails the scan instead of being treated as a clean result.

Upgrade Guard 0.4.0 includes this rule in both the npm package and bundled Action. At target `2026-10`, missing `owner_type` is reported as a migration warning; from target `2027-01`, it is reported as a deployment error.

Evidence: [Shopify's owner_type changelog](https://shopify.dev/changelog/posts/metafield-owner-types-required-for-checkout-and-customer-account-ui-extensions), [Checkout metafield configuration](https://shopify.dev/docs/apps/build/checkout/metafields), [Customer Account metafields](https://shopify.dev/docs/apps/build/customer-accounts/metafields-in-customer-accounts), and [2027-01 release notes](https://shopify.dev/changelog/release-notes/2027-01).

## Tax calculation and summary webhook identifiers

Shopify documents that third-party tax apps receive Global IDs instead of numeric IDs in tax calculation requests and tax summary webhook entity references from API version `2027-01`. For app-specific subscriptions, Shopify stores webhook topics in `[[webhooks.subscriptions]]` tables in `shopify.app*.toml` and serializes their payloads using the configured webhook API version.

Upgrade Guard reports `UG-TAX-001` only when it finds the exact `tax_summaries/create` topic in a declared Shopify app webhook subscription and the selected target is `2027-01` or later. This is a warning: the configuration proves the app subscribes to the affected summary webhook, but static analysis cannot establish whether its handler already accepts string GIDs or whether it also processes tax calculation requests.

Test tax calculation and webhook fixtures using GIDs, keep identifiers as opaque strings, and check any code that converts identifiers to numbers. This rule does not match tax-like strings in ordinary source files, comments, or Shopify Events subscriptions. It also cannot discover shop-specific subscriptions created through the Admin API.

Upgrade Guard v0.5.0 includes `UG-TAX-001` in the CLI package and bundled Action. Version 0.4.0 does not include this rule. The warning only identifies the configured webhook and version boundary; it does not establish how the handler processes identifiers.

Evidence: [Shopify's 2027-01 tax ID changelog](https://shopify.dev/changelog/posts/tax-webhook-summary-and-calculation-requests-now-use-global-ids), [the changelog introducing `tax_summaries/create`](https://shopify.dev/changelog/posts/taxsummariescreate-webhook-and-taxsummarycreate-mutation-now-available), [Shopify's webhook subscription configuration](https://shopify.dev/docs/apps/build/webhooks/subscribe), and [the 2027-01 release notes](https://shopify.dev/changelog/release-notes/2027-01).
