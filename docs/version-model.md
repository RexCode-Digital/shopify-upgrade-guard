# Version model

Shopify versions are quarterly date versions: January, April, July, and October. The bundled data is verified against Shopify’s [versioning documentation](https://shopify.dev/docs/api/usage/versioning). Stable versions are supported for at least 12 months; release candidates are for testing, not production.

The scanner builds an inventory from high-confidence Shopify contexts, then compares each version centrally. A rule can classify a finding as current debt or as introduced by the requested target. Arbitrary project `version` keys are not treated as Shopify versions.
