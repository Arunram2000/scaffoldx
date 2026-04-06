# Cursor Context for scaffoldx

This document is a quick project memory for future Cursor sessions.

## Project intent

- `scaffoldx` is a Node.js + TypeScript CLI that scaffolds projects from Git-hosted templates.
- Users run:
  - `scaffoldx list`
  - `scaffoldx create <stack> <template>`
- Templates are not hardcoded in source; they come from a remote registry JSON.

## Runtime + packaging

- Package name and command: `scaffoldx`
- Node requirement: `>=18` (uses global `fetch`)
- Build output: `dist/`
- Publish entrypoint: `bin.scaffoldx -> dist/index.js`

## Key files

- CLI wiring: `src/index.ts`
- Create flow: `src/commands/create.ts`
- Registry config and types: `src/config/templates.ts`
- Registry loading/validation: `src/utils/loadRegistry.ts`
- Template lookup: `src/utils/validateTemplate.ts`
- Degit source conversion: `src/utils/degitSource.ts`
- Clone operation: `src/utils/cloneTemplate.ts`
- Placeholder replacement: `src/utils/replacePlaceholders.ts`
- List command output: `src/utils/listTemplates.ts`
- Domain errors: `src/utils/errors.ts`

## Current registry contract

`TemplatesRegistry` shape is:

```json
{
  "flutter": {
    "clean-arch": {
      "repo": "Arunram2000/flutter-clean-arch-template",
      "branch": "main",
      "description": "Flutter clean architecture with Riverpod"
    }
  }
}
```

Rules:

- Entry object fields:
  - `repo` (required): GitHub-style `owner/repo`
  - `branch` (required): branch/tag to clone
  - `description` (optional): used in `scaffoldx list`
- Backward compatible support exists for string values (`"owner/repo"`) and defaults branch to `main`.
- Degit source is built as `repo#branch`.

## Registry URL behavior

- Env override key: `SCAFFOLDX_TEMPLATES_URL`
- Default URL constant: `DEFAULT_TEMPLATES_REGISTRY_URL` in `src/config/templates.ts`
- `loadRegistry()` uses:
  - 15s timeout via `AbortController`
  - strict shape validation with clear `RegistryError` messages
  - in-process promise cache for a single CLI run

## Create command behavior

`runCreate(stack, template)` currently:

1. Loads registry (`loadRegistry`)
2. Validates stack/template (`validateTemplate`)
3. Prompts for project name via inquirer
4. Creates a folder in current directory named after project
5. Clones template with degit (`force: true`, `cache: false`)
6. Recursively replaces `**PROJECT_NAME**` in text files

Constraints:

- Project name must match `^[a-zA-Z0-9._-]+$`
- Path separators and `.` / `..` are rejected
- Existing non-empty target folder is rejected

## Notes for future edits

- Keep CLI command name `scaffoldx` consistent everywhere (`package.json`, docs, logs).
- If registry schema changes again, update these together:
  - `src/config/templates.ts`
  - `src/utils/loadRegistry.ts`
  - `src/utils/validateTemplate.ts`
  - `src/utils/listTemplates.ts`
  - top-level `README.md`
- Private template support is not implemented yet; currently best for public repos.

## Local dev quick commands

From project root:

```bash
npm install
npm run build
npm run dev -- list
npm run dev -- create flutter clean-arch
```

For local command linking:

```bash
npm link
```
