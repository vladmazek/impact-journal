You are implementing Impact Journal. Before writing code, review these files in full:

- @README.md
- @PLAN.md
- @AGENTS.md
- @SETUP.md
- @ARCHITECTURE.md
- @prd/journal-mvp.md
- @prd/ui-ux.md
- @prd/data-model.md

Project intent:
- single-user private journal
- Next.js App Router monolith
- React + TypeScript
- Tailwind + shadcn/ui
- Prisma + MariaDB
- Dockerized deployment behind Caddy
- email/password auth
- image-only uploads stored on mounted host storage
- premium minimalist notebook-inspired UI
- excellent mobile and desktop experience

Implementation rules:
- do not introduce multi-user assumptions
- do not add cloud storage
- do not add AI features
- do not overbuild dashboards
- prioritize the writing experience and date-based browsing
- use repository file references with leading @ in your plan and summaries

Execution requirements:
1. Summarize the scope you will implement in this pass.
2. List the exact files you expect to create or modify.
3. Implement only the current milestone or the smallest coherent slice.
4. Run validation.
5. Return a grouped change summary, validations run, and remaining risks.

Build order:
- foundation
- auth
- daily entry model
- guided daily flow
- image uploads and tags
- weekly reflection
- polish

For the first pass, implement **Milestone 1 — Foundation and scaffolding** from @PLAN.md.

Deliverables for this pass:
- initialize project structure
- configure Tailwind and shadcn/ui
- configure Docker and MariaDB wiring
- initialize Prisma
- create base app shell
- create theme support
- create top bar and journal workspace shell
- create login screen stub
- document any env vars added

Constraints:
- no placeholder architecture drift
- no generic admin styling
- the UI should already feel like the intended product direction
