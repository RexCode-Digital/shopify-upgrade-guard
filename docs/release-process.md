# Release process

Releases below 1.0 are tag-triggered. The release workflow runs tests, coverage, lint, reproducible Action bundling, audit, package smoke tests, npm publication with provenance, and GitHub Release creation.

Before tagging a release:

- Confirm the npm Trusted Publisher for `shopify-upgrade-guard` still uses owner `RexCode-Digital`, this repository, and `.github/workflows/release.yml`.
- Check that the package version matches a new immutable `vX.Y.Z` tag and that the changelog has a matching `## X.Y.Z` section.
- Verify the generated Action bundle, coverage, package smoke test, third-party licence inventory, official evidence links, and npm provenance configuration.
- Run hosted CI on Node.js 22 and 24, `npm pack --dry-run`, and the dependency audit.

The CLI requires Node.js 22 or newer; the GitHub Action runs on Node.js 24. Treat any change to the CLI runtime floor as a breaking compatibility change and update the engine declaration, CI matrix, documentation, and changelog together. Marketplace submission is a separate final UI step.
