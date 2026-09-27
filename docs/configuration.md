# Configuration

`.upgradeguard.json` supports `targetVersion`, `failOn` (`never`, `error`, `warning`, or `info`), and `exclude`, an array of repository-relative glob patterns such as `fixtures/**`.

Invalid months, absolute paths, and traversal patterns fail closed. CLI flags override configuration values.
