# Open this project in Claude Code

This is the complete source handoff for the current workout app. **Movefield is a working name.**

1. Extract `Movefield_Claude_Code_Handoff.zip` fully. It is larger because it includes the exercise photos used by the website.
2. Open the extracted **movefield** folder in Claude Code. The correct folder contains `CLAUDE.md`, `HANDOFF.md`, `package.json`, `app`, `lib` and `mobile`.
3. Paste the contents of `CLAUDE_START_PROMPT.txt` into a new Claude Code session. It asks Claude to read the handoff and resume the existing project.
4. Claude should confirm the actual source state and follow the setup commands in `CLAUDE.md`. The web app and mobile starter have separate dependency installations.
5. Review the app locally before choosing more work. No cloud API key is needed for current local training features. Nothing in this package publishes the app.

`pnpm dev` and `npm start` keep running. Use a second terminal for checks, or stop the server with Ctrl+C first.

If you are using Windows PowerShell, `npm.cmd` and `pnpm.cmd` may avoid PowerShell script execution-policy issues. If the web development tooling has platform problems, use a normal Linux/WSL environment and install dependencies there rather than sharing `node_modules` across operating systems. Native Windows and WSL installation have not been re-tested for this handoff.

If Claude Code is not installed, use its official setup documentation: https://code.claude.com/docs/en/overview. This package does not install Claude Code or change its permissions.

## What is included

- Current web and Expo mobile source, package manifests and exact lockfiles.
- Exercise guides and web photo assets, reference data and license notices.
- Original working logos, licensed fonts and six theme palettes.
- Product requirements, development reports, test scripts and outstanding work.
- `HANDOFF_MANIFEST.json`: export metadata and per-file SHA-256 hashes.

## What is not included

- Dependencies, build output, `.git` history, local runtime caches, API keys, cookies or account credentials.
- Your browser's or phone's actual workout records. Those live separately on your device. The included sample data is part of the prototype.
- A verbatim export of every prior chat. The handoff consolidates the available conversation context and repository evidence, with the full saved product requirements included.
- A signed iPhone/Android app, installed Qwen model, real account service or completed cross-device sync.

The source was locally saved and tested. Revision 13 has not been successfully published to the existing private webpage; publication requires explicit approval.
