---
name: expo-file-system v56 API change
description: expo-file-system@56 (installed for SDK 54) no longer exports documentDirectory or writeAsStringAsync on the top-level namespace, breaking common usage patterns.
---

## Rule
Do not use `expo-file-system` classic API (`FileSystem.documentDirectory`, `FileSystem.writeAsStringAsync`) with v56 installed in SDK 54 projects. TypeScript will error with "Property does not exist".

**Why:** expo-file-system v56 restructured its exports and is designed for SDK 56, not SDK 54. When it ends up in an SDK 54 workspace (e.g. after installing), the old API is gone from types.

**How to apply:** For file sharing/export flows in the Aura app, use React Native's built-in `Share` API for native and a Blob/anchor approach for web. Skip expo-file-system entirely unless the project is on SDK 56+.
