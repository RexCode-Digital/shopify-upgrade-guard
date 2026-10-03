# Threat model

The scanner treats a repository as untrusted input. It only reads bounded text files with supported extensions, skips common generated/vendor directories, does not execute application code, and never invokes a shell or package manager. Files larger than 1 MiB are skipped.

The Action runs with `contents: read` in the documented example. Pull requests from forks should be treated as untrusted input; do not grant the workflow write permissions merely to create annotations. SARIF upload is intentionally not enabled by default.

Remaining risks include resource exhaustion from very large directory trees and files changing concurrently during a scan. File limits and symlink checks do not make the scanner a filesystem sandbox.

Discovery skips symbolic links, sorts entries deterministically, and caps scanned files at 2,000 and individual files at 1 MiB. Configuration and baseline paths must stay within the project and cannot traverse symlinks. These limits bound file analysis; they are not a sandbox for running arbitrary repository programs.
