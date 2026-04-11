# Encoding Standard

This repository must use UTF-8 for all text source files.

## Rules

- Save source files as `UTF-8` (without BOM preferred).
- Do not commit ANSI / Windows-1252 encoded files.
- Keep the HTML charset declaration in `apps/web/index.html`:
  - `<meta charset="UTF-8" />`

## Validation

Run the encoding guard before merging:

```bash
npm run check:encoding
```

The script scans `apps/` and `docs/` for:

- files that are not valid UTF-8
- common mojibake signatures (`Ã...`, `Â...`, `â€...`, `�`)
