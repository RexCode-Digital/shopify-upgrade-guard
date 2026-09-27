# Shopify release update process

For each January, April, July, and October release:

1. Read the [versioning guide](https://shopify.dev/docs/api/usage/versioning), current release notes, and recent developer changelog entries.
2. Record support dates and statuses in `data/versions.json` with the verification date.
3. Keep only changes with official evidence and a high-confidence static detector.
4. Add a rule record, source URL, migration guidance, synthetic fixture, false-positive test, and documentation entry.
5. Run the full local checks and inspect `npm pack --dry-run`.
6. Release below 1.0 using a reviewed tag; never publish a floating Action major tag before stable 1.0.

Do not scrape Shopify pages during a normal scan, and do not turn every changelog entry into a rule automatically.
