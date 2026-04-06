# scaffoldx

`scaffoldx` is a metadata-driven Node.js TypeScript CLI that scaffolds projects from template repositories.

No template names, prompt keys, or placeholder keys are hardcoded in CLI code. Everything is read dynamically from:

- remote registry JSON
- `template.json`
- `prompts.json`

## Install

```bash
npm install
npm run build
npm link
```

Now `scaffoldx` is available globally on your machine.

## Local test

```bash
scaffoldx create flutter clean-arch
```

Also available:

```bash
scaffoldx list
```

## Publish

```bash
npm publish
```

## CLI behavior

For `scaffoldx create <stack> <template>`:

1. Fetch remote registry
2. Resolve template repo from registry
3. Clone template repo (cached locally)
4. Read and validate `template.json`
5. Read and validate `prompts.json`
6. Ask dynamic questions from `prompts.json`
7. Copy only `template/` into current directory
8. Replace placeholders (for every answer key)
9. Run optional `hooks/post-create.js`
10. Print success

## Registry JSON guide

Default registry URL is set in `src/engine/registry.ts`:

`https://raw.githubusercontent.com/yourorg/scaffoldx-registry/main/templates.json`

Override at runtime:

```bash
export SCAFFOLDX_TEMPLATES_URL="https://raw.githubusercontent.com/yourorg/scaffoldx-registry/main/templates.json"
```

Registry format:

```json
{
  "flutter": {
    "clean-arch": {
      "repo": "yourorg/scaffoldx-flutter-clean-arch-template"
    }
  },
  "react": {
    "admin-dashboard": {
      "repo": "yourorg/scaffoldx-react-admin-dashboard-template"
    }
  }
}
```

`branch` is optional in registry and defaults to `main`.

## Template repo authoring guide

Each template repository must be plug-and-play with this structure:

```text
template/
template.json
prompts.json
hooks/post-create.js   (optional)
```

Example:

```text
scaffoldx-flutter-clean-arch-template/
├── template/
├── template.json
├── prompts.json
└── hooks/
    └── post-create.js
```

## template.json guide

```json
{
  "name": "clean-arch",
  "stack": "flutter",
  "version": "1.0.0",
  "description": "Flutter clean architecture starter",
  "placeholders": ["PROJECT_NAME", "API_URL"]
}
```

Validated with zod in `src/schemas/templateSchema.ts`.

## prompts.json guide

```json
{
  "questions": [
    {
      "name": "PROJECT_NAME",
      "message": "Project name?"
    },
    {
      "name": "API_URL",
      "message": "API base URL?"
    }
  ]
}
```

Validated with zod in `src/schemas/promptsSchema.ts`.

## Placeholder rules

- Placeholder format is `**KEY**`
- `KEY` must match prompt answer key
- Replacements are dynamic for all returned answers

Example:

- `**PROJECT_NAME**` -> answer for `PROJECT_NAME`
- `**API_URL**` -> answer for `API_URL`

## Hook system guide

If the template repo contains `hooks/post-create.js`, scaffoldx executes it after generation.

Hook process details:

- executed via Node `child_process`
- working directory: generated project directory
- environment variables:
  - `SCAFFOLDX_TARGET_DIR`
  - `SCAFFOLDX_ANSWERS_JSON`
  - `SCAFFOLDX_TEMPLATE_NAME`
  - `SCAFFOLDX_TEMPLATE_STACK`

Use this for post-generation automation like:

- `npm install`
- `flutter pub get`
- codegen/bootstrap tasks
