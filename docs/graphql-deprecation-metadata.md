# GraphQL deprecation metadata

Upgrade Guard does not bundle generated snapshots of Shopify's Admin GraphQL schema.

Shopify publishes versioned API references and API versioning guidance, but the [API Terms](https://www.shopify.com/legal/api-terms) describe the APIs and technical documentation as Shopify Property and do not clearly grant a right to redistribute schema-derived metadata in this package. The terms also require an API client and credentials for API access. This is a licensing and provenance uncertainty, not a legal conclusion that redistribution is prohibited.

The safe implementation is to keep the scanner offline and maintain bounded rules backed by official Shopify changelog or API reference pages. The scanner does not fetch schemas or require Shopify credentials. The [migration rules](../README.md#what-it-catches-today) follow this approach.

If Shopify publishes a versioned source with clear redistribution rights, a future build-time pack could contain only bounded entries such as API version, schema member, deprecation or removal status, affected version, migration note, and official source URL. It should omit schema definitions and descriptions, be generated reproducibly, and remain data-only at runtime. Until then, no generated metadata pack is shipped.
