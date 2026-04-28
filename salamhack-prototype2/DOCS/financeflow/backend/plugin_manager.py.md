# Dynamic plugin discovery and registration

**Source file:** `financeflow/backend/plugin_manager.py`

## Overview

- Scans **`plugins/`** for subfolders containing **`manifest.yaml`** and **`logic.py`**.

- Loads each `logic` module and collects **`router`** objects; registers them on the app with prefix **`/api/plugins`**.

- **`get_installed_plugins()`** re-reads the filesystem for the marketplace UI; **`get_available_plugins()`** lists folders under **`disabled_plugins/`**.

- Note: moving a plugin only updates routes after the app process reloads; the plugin **list** can update without restart.
