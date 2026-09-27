# Getting started

Until npm publication, install from a clone with `npm ci` and run `node src/cli.js scan --path PATH`. Use `--format json` for automation and `--format sarif` for code-scanning ingestion.

Start with `--fail-on never`, review findings, then add a reviewed `.upgradeguard-baseline.json` and move to `--fail-on warning` when the repository is ready.
