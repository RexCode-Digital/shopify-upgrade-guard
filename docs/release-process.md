# Release process

Releases are tag-triggered and below 1.0. The release workflow runs tests, coverage, lint, reproducible Action bundling, audit, package smoke tests, npm publication with provenance, and GitHub Release creation.

Before enabling the first release tag, configure npm Trusted Publishing for package `shopify-upgrade-guard`:

- npm package settings → Trusted Publishers → GitHub Actions;
- owner: `efegokdemir`;
- repository: `shopify-upgrade-guard`;
- workflow: `.github/workflows/release.yml`;
- environment: leave unset unless the npm package policy requires one.

Do not create `v0.1.0` or publish until this configuration is verified and the release PR has human review. Marketplace submission is a separate final UI gate.
