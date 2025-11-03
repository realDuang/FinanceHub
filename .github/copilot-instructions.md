# FinanceHub Copilot Guide

Welcome to the FinanceHub codebase! This guide provides essential context and conventions to help you contribute effectively. Please refer to this document whenever you're working on new features or bug fixes.

When trying to change the codebase, please remember always thinking and coding in English, response and explain in Chinese.

## Project Overview
- **Stack**: FastAPI backend in `backend/`, React + Vite + Tailwind frontend in `frontend/`; SQLite lives at `backend/data/financial_data.db`.
- **Backend entry**: `backend/main.py` wires CORS, calls `create_tables()` on import, and mounts `app/api/routes.py` under `/api/v1`.
- **Schemas vs. ORM**: SQLAlchemy models in `app/models/base.py` back the tables; matching Pydantic models live in `app/schemas.py` and should stay aligned when fields change.
- **DB session pattern**: Use `SessionLocal` from `app/database/connection.py` via `Depends(get_db)`; never instantiate your own engine.
- **Transactions search**: `TransactionService.get_records` expects string filters (dates, categories) and paginates; when adding filters update both backend method and frontend query builders.
- **Import workflow**: `TransactionImportExportService` enforces canonical Chinese columns (`交易时间`, `类型`, …) and re-runs `AggregationService.aggregate_monthly_data` after every successful import, clearing `financial_aggregation` first.
- **Dedup logic**: CSV imports dedupe on `(交易时间, 金额, 交易对方, 商品名称)`; keep this invariant or update `_check_duplicate` alongside UI copy in `ImportExportModal`.
- **Bill parsing**: `app/services/bill_parser_service.py` normalizes Alipay/WeChat exports and responds as a downloadable CSV; HTTP headers include `X-Parser-Details` metadata that the modal surfaces.
- **Aggregation**: `AggregationService` derives per-month rows, then recomputes `avg_consumption` and `recent_avg_consumption`; long-running changes should respect the two-phase update to avoid stale numbers.
- **Scripts**: `backend/scripts/import_transaction_data.py`, `aggregate_data.py`, and `clear_tables.py` are CLI entry points—follow their logging style and reuse service layers instead of duplicating logic.
- **Data location**: The SQLite path is computed relative to repo root; keep migrations or generated files under `backend/data/` to avoid path drift.
- **API evolutions**: Extend FastAPI routes in `app/api/routes.py`; ensure response models exist and export them through `app/schemas.py` so Swagger stays accurate.
- **Frontend API client**: `frontend/src/services/api.ts` centralizes REST calls; expose new endpoints there and consume them via the generic `useApi` hook.
- **API base URL**: `frontend/src/services/constants.ts` reads `VITE_SERVER_HOST`/`VITE_SERVER_PORT`; update `.env` files instead of hard-coding URLs.
- **Hooks pattern**: `useApi` auto-fetches when `immediate` is true; pass `immediate: false` when you need manual triggers (e.g., modal submissions).
- **Cash flow page**: `pages/CashFlowAnalysis.tsx` orchestrates time-range filters and toggles the import/export modal; keep shared state here to avoid duplication across charts.
- **Import modal UX**: `components/CashFlowAnalysis/ImportExportModal.tsx` already separates 手动CSV、支付宝、微信导入—mirror this structure when adding providers and surface backend errors via `importResult`.
- **Balance sheet UI**: `hooks/useBalanceSheetApi.ts` offers CRUD helpers hitting `/balance-sheet/*`; update `interfaces/index.ts` when backend schema changes.
- **Charts & utils**: Chart components consume pre-shaped data; adjust aggregations in `utils/chart-utils.ts` rather than each chart when adding metrics.
- **Styling**: Tailwind classes dominate; place shared gradients/layout tweaks in `src/index.css` or component-level wrappers instead of inline styles.
- **Running locally**: `start.sh` provisions conda env `visualize-balance-tool`, installs deps, then launches backend (`python backend/main.py`) and frontend (`npm run dev`).
- **Manual dev**: Backend requires Python 3.11 with `pip install -r backend/requirements.txt`; frontend uses `npm install` + `npm run dev` (Vite on 5173).
- **Testing**: There is no unified runner yet; backend relies on `pytest`, while frontend depends on manual inspection—call this out if you add new test suites.
- **Data refresh**: Re-run `aggregation_service.aggregate_monthly_data` (via script or import API) whenever you mutate `transaction_details` outside the import path.
- **Error handling**: FastAPI routes wrap service exceptions into `HTTPException` with localized messages; use the same pattern for consistency.
- **Deployment hint**: Tighten `allow_origins` in `main.py` before production; keep instructions in sync with hosting story if that changes.
