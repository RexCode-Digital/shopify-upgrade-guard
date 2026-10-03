# GitHub Action

The Action runs on `node24`, includes its bundled application code in `dist/index.js`, and does not install dependencies. Pin both checkout and Upgrade Guard to reviewed immutable SHAs. Use `fetch-depth: 0` when enabling PR change classification.

Inputs include `target`, `fail-on`, `fail-on-new`, `base-ref`, and `path`. Outputs are declared in `action.yml`: `outcome`, `finding-count`, `new-finding-count`, `error-count`, `current-versions`, and `result-json`.

`fail-on-new: true` requires a successful Git comparison. Fetch complete history and provide `base-ref` outside pull-request events. Missing history or an invalid reference fails instead of treating every finding as existing.
