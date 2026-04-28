# Main dashboard page

**Source file:** `piecemint/frontend/src/pages/Dashboard.tsx`

## Overview

- Fetches core data (`/api/core/*`) and plugin status (`/api/plugins`), then optional plugin calls (tax, forecast, expenses, PDF invoice).

- Implements **KPIs**, Recharts **area/bar** charts (cashflow, inflow vs outflow, category, clients, suppliers), **zombie subscription** cards, and CRM tables.

- Uses `http://localhost:8000/api` as base URL unless changed for deployment.
