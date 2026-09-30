# GitHub Action

The Action runs on `node24`, includes its runtime in `dist/index.js`, and does not install dependencies. Pin both checkout and Upgrade Guard to reviewed immutable SHAs. Use `fetch-depth: 0` when enabling PR change classification.

Outputs are declared in `action.yml`: `outcome`, `finding-count`, `error-count`, `current-versions`, and `result-json`.
