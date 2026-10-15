# Third-party software and data

The [MIT license](LICENSE) covers this repository's original code,
configuration, and documentation. It does not relicense the third-party
applications, container images, models, or quotations referenced here. Their
respective upstream licenses apply.

## Quotes dataset

`services/quotes-service/quotes.json` contains 2,508 records derived from
[tengomucho/english_quotes_sanitized](https://huggingface.co/datasets/tengomucho/english_quotes_sanitized),
which is derived from
[Abirate/english_quotes](https://huggingface.co/datasets/Abirate/english_quotes).
The original dataset card credits **Abir ELTAIEF (Abirate)**, describes
collection from Goodreads, and declares
[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
The bundled dataset is excluded from this repository's MIT license.

The local exporter, `export_quotes.py`, trims quote and author whitespace,
removes one surrounding pair of quotation marks, skips records with an empty
quote or author, renames `quote`/`author` to `q`/`a`, and retains `tags`.
The service additionally filters quotes longer than 240 characters at runtime.

The upstream revision and exact retrieval date of the existing export were not
recorded. Its SHA-256 is:

```text
e8b851005bfc33aa78d14ba7fd76cf8814e33349f40568c282af0e5231827ebe
```

The upstream license declaration concerns the dataset; it does not establish
rights to every underlying quotation. Author names and tags are supplied by
the upstream data and may include disputed or incorrect attributions. Retain
this provenance and the upstream license information when redistributing the
dataset, and review the underlying material for your intended use.
