# Contributing

Thanks for helping improve Shopify Upgrade Guard.

## Contribution terms

You retain copyright in your contributions. By submitting a contribution, you agree that it is provided under the same MIT licence that applies to this project. You confirm that you have the right to submit the contribution. Disclose any third-party code or assets and identify their applicable licences before including them.

The project deliberately prefers **high-confidence, evidence-backed checks** over a large noisy rule catalogue. A false-positive-heavy upgrade scanner is worse than a smaller one developers can trust.

## Good contribution areas

- New Shopify migration rules backed by official `shopify.dev` evidence
- False-positive reductions
- Target-version logic
- PR lifecycle classification
- SARIF and CI improvements
- Scanner safety and cross-platform fixtures
- Documentation and reproducible examples

Browse the [open issues](https://github.com/RexCode-Digital/shopify-upgrade-guard/issues) for current work.

## Rule requirements

Every Shopify-specific rule should include:

1. an official Shopify documentation or changelog source
2. the affected API surface
3. the affected version or lifecycle status
4. bounded deterministic detection logic
5. concise migration guidance
6. a positive fixture test
7. false-positive coverage

Do not add rules based only on blog posts, social posts, guesses, or undocumented behaviour.

## Development

Requires Node.js 20 or newer.

```bash
npm ci
npm test
npm run coverage
npm run lint
npm run check:dist
npm audit --omit=dev --audit-level=high
npm pack --dry-run
```

Keep generated Action output in sync with source.

## Pull requests

Keep PRs focused. Explain:

- what Shopify behaviour is being detected
- why the matcher is safe
- the official evidence
- the affected versions
- how false positives are avoided

AI-assisted contributions are welcome, but the human submitter must review and understand the change.

## Security

Do not report vulnerabilities or sensitive merchant/repository data in public issues. Follow [SECURITY.md](SECURITY.md).

## Maintainer updates

For quarterly Shopify evidence updates and releases, follow [the maintainer release process](docs/maintainer-release-process.md).

Do not publicly report findings from third-party repositories without permission.
