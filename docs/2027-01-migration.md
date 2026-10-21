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

This rule is in the Unreleased change set. Existing npm package versions and published Action tags do not include it until a release containing the change is published.

Evidence: [Shopify's owner_type changelog](https://shopify.dev/changelog/posts/metafield-owner-types-required-for-checkout-and-customer-account-ui-extensions), [Checkout metafield configuration](https://shopify.dev/docs/apps/build/checkout/metafields), [Customer Account metafields](https://shopify.dev/docs/apps/build/customer-accounts/metafields-in-customer-accounts), and [2027-01 release notes](https://shopify.dev/changelog/release-notes/2027-01).
