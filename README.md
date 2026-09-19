# MOS Plugin Source Limit

A small MOS utility plugin that makes the MOS Hub plugin source archive size limit adjustable from the MOS UI.

## What it changes

MOS currently defines its source archive limit in:

```text
/usr/local/lib/mos-api/src/services/plugins.service.js
```

The plugin updates the `MAX_SOURCE_SIZE` MB value and the matching error messages, then restarts the MOS API with `/etc/init.d/api restart` after a short delay.

The configured value is stored in the plugin's normal MOS `settings.json` and reapplied by `mos_start_after_services` and `mos_osupdate`, so a reboot or MOS update that restores the stock value can be repaired automatically.

## Safety behavior

- Allowed range: 1–2048 MB.
- The patch only runs if the expected `MAX_SOURCE_SIZE = N * 1024 * 1024` declaration exists.
- If MOS changes that source structure, the plugin refuses to patch it rather than guessing.
- Uninstall attempts to restore the stock 10 MB value.

## Build

1. Push this repository to GitHub.
2. Enable **Settings → Actions → General → Workflow permissions → Read and write permissions**.
3. Open **Actions → Build and Release → Run workflow**.
4. Build version `0.1.0`.
5. Add `hub-example/pluginlimit.json` to your MOS Hub's `plugins/` directory (adjust repository URL if needed).
6. Refresh MOS Hub and install.

This repository is intentionally tiny and does not bundle large binaries, so its GitHub source archive remains below MOS's stock 10 MB plugin source limit.
