# Release process

Releases are tag-triggered and below 1.0. The release workflow runs tests, coverage, lint, reproducible Action bundling, audit, package smoke tests, npm publication with provenance, and GitHub Release creation.

Before enabling the first release tag, configure npm Trusted Publishing for package `shopify-upgrade-guard`:

- npm package settings → Trusted Publishers → GitHub Actions;
- owner: `efegokdemir`;
- repository: `shopify-upgrade-guard`;
- workflow: `.github/workflows/release.yml`;
- environment: leave unset unless the npm package policy requires one.

For 0.2.0, verify the release PR, generated `dist`, coverage, package smoke test, and official evidence links before creating the tag. Marketplace submission is a separate final UI gate.
