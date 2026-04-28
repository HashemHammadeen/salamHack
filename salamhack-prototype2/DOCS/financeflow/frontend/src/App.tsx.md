# Root React component: shell and routes

**Source file:** `financeflow/frontend/src/App.tsx`

## Overview

- Wraps the app in **`BrowserRouter`**, provides floating **nav pill** with tenant dropdown and links to **Dashboard** and **Plugins (Marketplace)**.

- Passes **`tenantId`** to routed pages; API calls in children should send **`X-Tenant-ID`** to match the backend.
