# Sekhon AI Office — Step 1 cleanup

Implemented on branch `sekhon-phase-1-branding`.

## Changes

- Sekhon Manager and business-role names in avatar selection, onboarding, voice introductions, agent prompts and setup help.
- Existing inherited default names migrate when active, archived and restorable agents load. IDs, avatar keys, sessions, goals and custom names are retained.
- Imported legacy manifests display business-role names immediately. New manifests and deep links use the Sekhon identity; legacy imports and links remain accepted.
- Neutral office dialogue replaces inherited TV dialogue. Saved theme choices resolve to the Sekhon office without deleting agents.
- Release screens, update messages, IDE heading, splash accessibility text and packaging privacy messages use Sekhon branding.
- Update requests use the Sekhon repository; manual installer URLs match the packaged Sekhon filenames.
- Settings expose no Sekhon paid-plan or sponsor controls. Provider API usage information remains truthful and separate.
- Bundled hire gallery and operational documentation use Sekhon identity. Inherited purchase/contact pages are retired. Original source and third-party license notices remain intact.
- The regression-test command works on Windows without shell glob expansion.

## Validation

- Node and renderer typechecks: passed.
- Production build: passed.
- Cleanup-related regression tests: 86 passed, 0 failed.
- Full suite: 920 passed, 31 failed, 14 skipped. An unchanged baseline reproduced 33 failures. The final patch adds no new failures and resolves two stale test expectations.
- Remaining failures include existing Windows path, symlink permissions, socket/Electron environment and unrelated source-inspection/catalog checks.
- React review: text changes preserve component structure, event behavior and accessibility; no new hooks or rendering dependencies were added.

This validates the source update. A packaged Windows installer, fresh-install onboarding and live cloud-provider sessions were not run in this environment. Historical upstream archives and mandatory license/provenance records are not runtime Sekhon branding.

## Update your existing app checkout

Close the app, open a terminal in your existing app source folder, then run:

```powershell
git switch sekhon-phase-1-branding
git pull --ff-only origin sekhon-phase-1-branding
npm install
npm run dev
```

Check the splash and Settings, Deploy Agent avatar labels, release/update text and voice introduction. Restore an existing agent and confirm its saved session and goal remain available. No API keys need to be re-entered for this source update.

Step 2 (workspace-specific Studio/Agency deployment templates) is separate from this cleanup.
