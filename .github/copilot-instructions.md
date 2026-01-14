## Repository snapshot

- Workspace root contains a small VS Code workspace under `my-vscode-workspace/`.
- Key files to inspect:
  - `my-vscode-workspace/src/main.ts` — the main entry (currently a placeholder comment).
  - `my-vscode-workspace/.devcontainer/devcontainer.json` and `Dockerfile` — devcontainer definition and container runtime.
  - `my-vscode-workspace/.vscode/launch.json` — debug configuration that targets `${workspaceFolder}/src/main.ts`.
  - `my-vscode-workspace/my-vscode-workspace.code-workspace` — workspace file used to open the project.

## Big-picture architecture (what to know fast)

- This repo is a minimal VS Code workspace scaffold. The primary code lives under `my-vscode-workspace/src/` with a single entry at `main.ts`.
- The project is intended to be run in a devcontainer (see `.devcontainer/`): `devcontainer.json` will run `npm install` after creation.
- There is no `package.json` or tests currently in the repository. Expect to add build tooling manually if you implement Node/TS features.

## Developer workflows (concrete, repo-specific)

- Open: Use the workspace file `my-vscode-workspace/my-vscode-workspace.code-workspace` to open the project in VS Code.
- Devcontainer: Reopen in Container (Command Palette → "Remote-Containers: Reopen in Container"). The devcontainer runs `postCreateCommand: npm install` and sets `remoteUser: vscode`.
- Debugging: `.vscode/launch.json` launches Node with `program: ${workspaceFolder}/src/main.ts` and expects output JS under `dist/**/*.js`. If you add TypeScript sources:
  - Either produce `dist/` (e.g., run `tsc --outDir dist`) or adapt `launch.json` to use `ts-node`/`node --loader ts-node/esm`.
  - Be careful: the current `launch.json` and `Dockerfile` assume Node runtime for `.ts` — reconcile by adding a TypeScript build step or running with a TS runner.

## Project-specific conventions and gotchas

- Location convention: primary workspace lives under `my-vscode-workspace/`. When making multi-file changes, edit files in that folder rather than adding top-level cruft.
- Tooling hint: the devcontainer and Dockerfile both call `npm install`, but no `package.json` is present. If you introduce Node code, add a `package.json` at `my-vscode-workspace/` and update `postCreateCommand` and Dockerfile if necessary.
- Minimal scaffold: `src/main.ts` currently contains only a comment. Expect that implementing features will require initializing project tooling (lint, formatter, test runner).

## Integration points & external dependencies

- Devcontainer Dockerfile: installs `nodejs` and `npm` and runs `node src/main.ts` in the container. If adding TypeScript, the Dockerfile should be updated to build before runtime (or use a node image with ts-node).
- VS Code launch config: Node-based debugging. If you add web APIs, external services, or environment variables, document them in `devcontainer.json` or `.env` files and update `launch.json` accordingly.

## How AI agents should operate in this repo

1. Start by opening `my-vscode-workspace/my-vscode-workspace.code-workspace` and read `src/main.ts`, `.devcontainer/devcontainer.json`, `.devcontainer/Dockerfile`, and `.vscode/launch.json`.
2. Do not change devcontainer settings unless you need to add language tooling (for example, add `typescript` and `ts-node` to `package.json` and update `postCreateCommand`).
3. If adding TypeScript development, create a `package.json` and `tsconfig.json` under `my-vscode-workspace/` and ensure `launch.json` and Dockerfile reflect the compile/run strategy.
4. Keep edits inside `my-vscode-workspace/` for code-related changes. Use root-level README only for repository-level notes.

## Examples (from this codebase)

- Debug config example: `"program": "${workspaceFolder}/src/main.ts"` (see `.vscode/launch.json`). Agents: if you add TS build, ensure `outFiles` points to `dist/**/*.js` after compilation.
- Devcontainer example: `"postCreateCommand": "npm install"` (see `.devcontainer/devcontainer.json`). Agents: run `npm install` only if `package.json` is present.

## When you are blocked / missing files

- Missing package.json: add one at `my-vscode-workspace/package.json` with the required scripts (e.g., `build`, `start`, `dev`) and update devcontainer/Dockerfile accordingly.
- No tests: document any test framework you add and include a `test` script in `package.json` so CI or maintainers can run `npm test`.

---
If any section is unclear or you'd like more detail (for example, a recommended `package.json` or `tsconfig.json` to bootstrap TypeScript), tell me which area to expand and I'll update this file.
