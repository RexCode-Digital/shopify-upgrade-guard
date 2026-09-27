# Threat model

The scanner treats a repository as untrusted input. It only reads bounded text files with supported extensions, skips common generated/vendor directories, does not follow application code, and never invokes a shell or package manager. Files larger than 1 MiB are skipped.

The Action runs with `contents: read` in the documented example. Pull requests from forks should be treated as untrusted input; do not grant the workflow write permissions merely to create annotations. SARIF upload is intentionally not enabled by default.

Remaining risks include malformed filenames, symlink behaviour supplied by the runner, and resource exhaustion from very large directory trees. These should be addressed before a 1.0 release with explicit traversal limits and symlink tests.
