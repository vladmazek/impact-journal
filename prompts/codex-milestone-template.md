Use this prompt template at the start of each new Codex milestone thread.

Read these files first:
- @README.md
- @PLAN.md
- @AGENTS.md
- @SETUP.md
- @ARCHITECTURE.md
- @prd/journal-mvp.md
- @prd/ui-ux.md
- @prd/data-model.md

Current milestone:
[PASTE THE MILESTONE NAME AND SCOPE HERE]

Instructions:
- implement only this milestone
- keep the scope tight
- do not rewrite unrelated areas
- use existing design language and repo conventions
- use leading-@ file references in your summary
- if a better implementation detail is needed, choose the option that keeps the app simpler and more durable for a single-user MVP

Before coding:
1. summarize what you are about to build
2. list exact files you will inspect or change
3. call out any assumptions

After coding:
1. group changed files by area
2. explain why each area changed
3. list validation commands run
4. note any incomplete items or risk
5. keep the summary brief and concrete

Additional reminders:
- the writing experience is the product
- image files must use mounted host storage
- filenames must begin with YYYY-MM-DD-
- do not add multi-user logic
- do not add cloud or SaaS integrations in MVP
