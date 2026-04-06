# scaffoldx

Production-style Node.js CLI for scaffolding projects from templates hosted on Git. Template definitions are loaded from a **remote JSON registry** so you can add or change templates without shipping a new CLI release.

## Requirements

- Node.js **18+** (uses global `fetch`)

## Install

Install globally:

```bash
npm install -g scaffoldx
```

Or run on demand without a global install:

```bash
npx scaffoldx list
```

## Usage

List stacks and templates from the registry:

```bash
scaffoldx list
```

Create a project (example):

```bash
scaffoldx create flutter clean-arch
```

You will be prompted for a **project name**. A new directory with that name is created in the current working directory, the template is cloned with [degit](https://github.com/Rich-Harris/degit), and the literal placeholder `**PROJECT_NAME**` is replaced in text files.

## Template registry

The CLI downloads JSON shaped as **stack → template slug → entry**, where each entry provides a **public Git repo** and **branch**. [degit](https://github.com/Rich-Harris/degit) downloads that ref using `repo#branch` (for GitHub: `owner/repo#main`).

```json
{
  "flutter": {
    "clean-arch": {
      "repo": "Arunram2000/flutter-clean-arch-template",
      "branch": "main",
      "description": "Flutter clean architecture with Riverpod"
    }
  },
  "react": {
    "admin-dashboard": {
      "repo": "Arunram2000/react-admin-template",
      "branch": "main",
      "description": "React admin starter"
    }
  }
}
```

- **`repo`**: `owner/repository` on GitHub (same form degit uses for public GitHub repos).
- **`branch`**: branch name or tag (e.g. `main`, `develop`).
- **`description`**: optional; shown in `scaffoldx list`.

**Backward compatibility:** a template value may still be a plain string (e.g. `"user/repo"`); it is treated as `repo` with branch `main`.

### Public vs private repos

- **Public** GitHub repos work out of the box; no token is required for degit to download the archive.
- **Private** repos need authentication (degit does not handle GitHub auth for anonymous downloads). Options: use a public template repo, or extend the CLI later (e.g. `git clone` with credentials, or a degit server that supplies a token).

You do **not** need to publish anything to npm for the template repos—only the registry JSON must be reachable (e.g. raw GitHub URL), and each `repo` must exist and allow read access for whoever runs the CLI.

**Default URL:** set `DEFAULT_TEMPLATES_REGISTRY_URL` in [`src/config/templates.ts`](src/config/templates.ts) to your hosted file (for example `raw.githubusercontent.com/.../templates.json`).

**Override without rebuilding:** point the CLI at any HTTPS JSON URL:

```bash
export SCAFFOLDX_TEMPLATES_URL="https://example.com/templates.json"
scaffoldx list
```

## Local development (`npm link`)

From the package root:

```bash
npm install
npm run build
npm link
```

Then run `scaffoldx` from any directory. While iterating on TypeScript sources:

```bash
npm run dev -- list
npm run dev -- create flutter clean-arch
```

## Publishing to npm

1. Update `version` in `package.json`.
2. Set your real default registry URL in [`src/config/templates.ts`](src/config/templates.ts).
3. Build and confirm `dist/` output:

   ```bash
   npm run build
   ```

4. Ensure `package.json` has `"files": ["dist"]` and `"bin"` pointing at `dist/index.js`.
5. Publish:

   ```bash
   npm publish --access public
   ```

`prepublishOnly` runs `npm run build` automatically.

## License

MIT
