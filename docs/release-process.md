# Release process

Releases are tag-triggered and below 1.0. The release workflow runs tests, coverage, lint, reproducible Action bundling, audit, package smoke tests, npm publication with provenance, and GitHub Release creation.

Before enabling the first release tag, configure npm Trusted Publishing for package `shopify-upgrade-guard`:

- npm package settings → Trusted Publishers → GitHub Actions;
- owner: `RexCode-Digital`;
- repository: `shopify-upgrade-guard`;
- workflow: `.github/workflows/release.yml`;
- environment: leave unset unless the npm package policy requires one.

For each release, verify the reviewed PR, generated `dist`, coverage, package smoke test, third-party license inventory, and official evidence links before creating a tag. Marketplace submission is a separate final UI gate.

## Next candidate: 0.4.0

The next candidate is `0.4.0` under the current 0.x versioning policy. Requiring Node.js 22 is a breaking change for users still on Node.js 20, so include it in the release notes and check `engines.node`, setup-node matrices, and runtime documentation together.

Before any release, require PR review and hosted CI on Node.js 22 and 24, reproducible Action bundling, clean package installation and smoke checks, `npm pack --dry-run`, dependency audit, and a review of third-party notices and immutable Action SHAs. Confirm npm provenance configuration and changelog accuracy. This is a plan only; it does not create a tag, GitHub Release, or npm publication.
