# Sekhon AI Office

**A local-first AI team for running two real workflows: Sekhon Studio and a one-person freelance advertising agency.**

Sekhon AI Office is a customized desktop multi-agent workspace built on the open-source Munder Difflin codebase. The goal is not to run a generic software office: it is to give one human owner a practical AI team that can find work, plan it, produce it, and help operate the business.

## Product direction

### 1. Sekhon Studio — 3D printing business

The workspace is being shaped around:

- Business Manager / orchestrator
- Website & e-commerce development
- Product, category, variation and inventory work
- 3D-product and parametric-model assistance
- Product copy, SEO and social content
- Orders, customers, invoices and business analysis
- GitHub / Vercel / Supabase workflows for Sekhon Studio systems

### 2. Freelance Advertising Agency

A one-person agency supported by an AI team:

- Creative Director / orchestrator
- **Business Lead** — finds relevant freelance opportunities, researches leads and prepares them for review
- Strategist
- Copywriter
- Art Director
- AI Image specialist
- AI Video / Motion specialist
- Production / delivery coordinator

The intended agency workflow is:

**Find work → evaluate the opportunity → prepare the pitch → win the project → produce the work → deliver it.**

Important actions such as contacting a client, submitting a proposal, agreeing to pricing, spending money or performing destructive operations should remain human-approved.

## Free and local-first

Sekhon AI Office has **no Sekhon app subscription, seat fee or feature paywall during development**.

AI usage is separate. Cloud model/API providers may charge for their own services. The app is also being developed toward first-class local-model workflows so compatible local inference can be used without a Sekhon AI Office subscription.

## Current foundation

The inherited application is an Electron desktop app using React, TypeScript, Pixi.js, xterm.js and node-pty. It provides the foundation for:

- multiple terminal-based agents
- an orchestrator/manager
- agent messaging and task coordination
- memory and project files
- a visual office floor
- per-agent working sessions
- provider/model configuration
- local-first operation

Sekhon-specific provider, local-model and business-workspace changes are being implemented incrementally and should be treated as development work until they have passed the project's build/typecheck tests.

## Development

```bash
git clone https://github.com/Jagjeetsekhon3/sekhon-ai-office-source.git
cd sekhon-ai-office-source
npm install
npm run typecheck
npm run dev
```

Production build:

```bash
npm run build
```

See `package.json` for platform-specific distribution commands.

## Repository

This repository is the working source for Sekhon AI Office:

https://github.com/Jagjeetsekhon3/sekhon-ai-office-source

## License and upstream attribution

The source code is distributed under the MIT License. This project is derived from **Munder Difflin** by Chaitanya Giri; the original copyright and MIT license notice are retained in `LICENSE`.

Bundled pixel-art assets under `src/renderer/src/assets/` are **not covered by the MIT source-code license**. They include LimeZu Modern Interiors assets under a separate license that requires credit. See `LICENSE-ASSETS` and `src/renderer/src/assets/ATTRIBUTION.md`.

As Sekhon AI Office develops its own visual identity, third-party artwork should only be replaced with original or appropriately licensed assets. Do not remove required attribution for any assets that remain in the repository.

## Status

Active development. Current priorities are:

1. finish Sekhon branding and remove inherited purchase/PRO surfaces;
2. verify and improve API-provider/local-model configuration;
3. build the two Sekhon workspaces and their default agent teams;
4. add the Advertising Agency Business Lead and leads workflow;
5. connect useful business/development tools while keeping sensitive credentials out of the repository;
6. run full typecheck/build testing before treating a change as release-ready.
