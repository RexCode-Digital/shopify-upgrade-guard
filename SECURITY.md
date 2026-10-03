# Security policy

## Reporting a vulnerability

Report suspected vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/efegokdemir/shopify-upgrade-guard/security/advisories/new). Include the exact version, affected command, and a minimal sanitized reproduction. Do not include Shopify credentials, access tokens, private keys, merchant data, or private source.

Please coordinate public disclosure with the maintainer while the report is investigated and a fix is prepared. Response time depends on maintainer availability; no response-time guarantee is offered.

## Supported versions and security model

The latest published package and `main` receive security attention. Upgrade to the latest patch before reporting an issue.

Ordinary scans read local files, do not execute scanned repository code, contact Shopify, or upload source. Static analysis does not certify security or replace runtime testing. Symlink checks and file-size limits do not sandbox a filesystem that changes concurrently during scanning.
