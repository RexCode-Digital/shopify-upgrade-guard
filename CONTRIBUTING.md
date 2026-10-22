# Contributing to Shopify Upgrade Guard

Contributions are welcome around version-aware Shopify API migration rules backed by official sources, bounded detection, false-positive reduction, and CLI/Action reliability.

This project is MIT licensed. You retain copyright in your contributions and confirm you have the right to submit them. Identify third-party code and assets with their applicable licences.

Use Node.js 22 or newer. Install the locked dependencies and run the relevant checks before opening a pull request:

```sh
npm ci
npm test
npm run coverage
npm run lint
npm run build:action
npm run check:dist
npm run package:smoke
npm run action:check
npm run pack:check
npm audit
git diff --check
```

Add a regression test for each behaviour change. Keep fixtures synthetic and sanitised. Link current official Shopify evidence for Shopify-specific rules or mappings, and include a negative case where static detection could otherwise produce a false positive. Keep output deterministic and preserve the product's uncertainty and privacy boundaries.

The project follows a solo-maintainer review model. Use a focused pull request and record the checks actually run. Human approval is not a branch-protection requirement; automated checks remain required. AI-assisted contributions are welcome. Contributors are responsible for reviewing and understanding every submitted change.

Read the shared [RexCode Open Source standards](https://github.com/RexCode-Digital/.github/blob/main/docs/oss/standards.md). For security reports, use [SECURITY.md](SECURITY.md); for safe usage questions, use [SUPPORT.md](SUPPORT.md).