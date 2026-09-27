# Architecture

Discovery produces bounded source files and a structured Shopify version inventory. Rules provide detection metadata and version-aware evaluation. The scan orchestrator combines current inventory, target version, configuration, baseline fingerprints, and optional Git changed-line information. Output adapters render the same result as human text, JSON, SARIF, or Action annotations.
