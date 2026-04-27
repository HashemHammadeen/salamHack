# FinanceFlow documentation mirror

This folder mirrors the `financeflow/` project tree. For each **source file** in the repo, a documentation file here explains that file’s role.

## Naming

- Doc files are named **`<original-filename>.md`** (for example `main.py.md`, `Dashboard.tsx.md`) so names stay unique in folders that contain both `App.css` and `App.tsx`.
- **Exception:** `README.md` in this tree documents the corresponding `README.md` under `financeflow/`.

## Excluded (by design)

`node_modules/`, `venv/`, `dist/`, `__pycache__/`, and other generated or vendor content are not documented here.

## Regenerating

Run `python3 DOCS/generate_doc_files.py` from the repository root, and extend the `SPECS` map in that script when you add new source files.
