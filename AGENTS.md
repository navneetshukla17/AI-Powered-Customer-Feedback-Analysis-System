# AGENTS.md — LLM-Powered Customer Feedback System

## Quick start

```bash
source venv/bin/activate
pip install -r requirements.txt
# Ensure .streamlit/secrets.toml has HF_TOKEN
streamlit run app.py
```

## Entrypoints

- `app.py` — main launcher with sidebar radio (Rating Prediction / User Dashboard / Admin Dashboard). Uses `importlib` to dynamically load modules from `task2/`.
- `task2/user_dashboard.py` — standalone customer dashboard (also runnable via `streamlit run task2/user_dashboard.py`).
- `task2/admin_dashboard.py` — standalone admin dashboard (also runnable via `streamlit run task2/admin_dashboard.py`).

The "Rating Prediction" page in `app.py` is purely informational (static markdown/expanders of prior results). No prediction code runs.

## Storage

- `feedback_data.csv` — single CSV file, read/written by both dashboards on every action. No database. Committed with sample rows.

## Secrets

- `.streamlit/secrets.toml` is gitignored. Must contain `HF_TOKEN` for HuggingFace Inference API.
- Model: `Qwen/Qwen2-7B-Instruct` at `https://api-inference.huggingface.co/models/Qwen/Qwen2-7B-Instruct`.

## Dependencies (exact pinned versions)

```
streamlit==1.39.0  pandas==2.2.3  plotly==5.24.1  requests==2.31.0
```

No dev dependencies (no tests, no linter, no type checker, no formatter).

## Conventions

- Data files are at repo root (not in `task2/`).
- `st.secrets.get("HF_TOKEN", "")` — default empty; API will fall back to hardcoded fallback responses.
- Admin dashboard parses AI output by scanning `SUMMARY:`, `ACTION 1:` markers; fragile to format drift.
- No `__init__.py` in `task2/` (Python subpackage not needed — `importlib` loads by file path).

## What to avoid

- Do not add a database migration or change storage without understanding the CSV is shared mutable state.
- Do not reformat `feedback_data.csv` columns — schema is: `id,timestamp,rating,review,ai_response,summary,actions,date`.
- The `venv/` directory is gitignored. Use it rather than creating a new one.
