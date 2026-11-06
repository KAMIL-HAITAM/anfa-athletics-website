
# ANFA ATHLETICS — AI Development Workflow

## 1. Purpose

This document defines how AI assistants must help develop the ANFA ATHLETICS platform.

The project owner is a beginner in web development. Instructions must therefore be clear, practical and suitable for someone who does not write code independently.

The goal is to build a high-quality custom e-commerce platform through small, controlled, testable steps.

## 2. Read the documentation first

Before starting a development task, review the relevant project documents:

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/AI_WORKFLOW.md`

Inspect the existing code before proposing changes.

Do not assume that a feature is missing simply because it has not been mentioned in the current conversation.

## 3. One task at a time

Work on one clearly defined task at a time.

Do not attempt to implement the entire website, backend, mobile app, avatar system and virtual fitting room in one response or one coding operation.

Break large features into smaller tasks.

For each task:
1. Explain the goal in simple language.
2. Identify the files that need to change.
3. Implement only the agreed task.
4. Run appropriate checks.
5. Explain how to test the result.
6. Report any errors or unfinished work.
7. Wait for confirmation before moving to a major unrelated task.

## 4. Beginner-friendly instructions

The project owner may not understand technical terminology.

When giving instructions:
- Use plain language.
- Explain where to click and which file to open.
- Provide exact commands when needed.
- Identify the folder where commands must be run.
- Explain what success looks like.
- Explain what to do if an error occurs.
- Never assume the project owner knows how to fix code manually.

Avoid giving a large number of unrelated instructions in one message.

When a terminal command could delete data or change system settings, explain its effects before recommending it.

## 5. Protect the existing project

Never delete or replace existing files without a clear reason and approval.

Before editing a file:
- Read its current contents.
- Understand its purpose.
- Identify any dependencies.
- Prefer small, focused changes.
- Preserve existing working functionality.

Do not replace entire configuration files merely to make a small change.

Never run destructive commands without explaining the consequences and obtaining approval.

## 6. Rules for coding changes

When implementing a feature:
- Follow the architecture and design-system documents.
- Reuse existing components where appropriate.
- Keep code organized and understandable.
- Avoid unnecessary dependencies.
- Do not duplicate business logic.
- Keep API keys and private credentials out of client-side code.
- Validate important inputs on the server.
- Use appropriate error handling.
- Do not disable security features to work around development errors.

Do not claim a feature is complete if it has only been mocked up visually.

Clearly distinguish between:
- Visual prototype.
- Working frontend feature.
- Backend-connected feature.
- Tested production feature.

## 7. Testing requirements

After a change, run relevant checks whenever the development environment allows it.

These may include:
- TypeScript checks.
- Linting.
- Build checks.
- Browser testing.
- API tests.
- Authentication and authorization tests.
- Responsive layout checks.

Report the actual results.

If a test cannot run, explain why. Do not invent successful test results.

Check that the change does not break unrelated pages or features.

## 8. Git and checkpoints

Use Git to preserve working versions of the project.

Before major changes:
1. Check the current Git status.
2. Confirm that existing work is saved.
3. Create a checkpoint when appropriate.
4. Make the changes.
5. Run tests.
6. Review the resulting differences.
7. Commit the changes only when the result is understood and appropriate.

Do not discard existing work, force-push, rewrite shared history or delete branches without explicit approval.

Never commit secrets, passwords, API keys, customer data or private configuration files.

## 9. Working with multiple AI assistants

The project has one shared codebase and one source of truth.

- ChatGPT primarily helps with planning, explanations, troubleshooting and implementation guidance.
- Gemini may review code, screenshots and technical proposals.
- Google AI Studio may be used for AI experiments when relevant.
- Other coding tools may be introduced later.

These roles are guidelines, not exclusive restrictions.

Only one assistant should make overlapping changes to the same files at a time.

Before another assistant modifies the project:
- Save the current work.
- Review the changes made so far.
- Record important decisions in the documentation.
- Ensure there is a recoverable Git checkpoint where appropriate.

Do not let multiple AI assistants independently redesign the architecture.

If assistants disagree, explain the disagreement and recommend a reasoned resolution instead of silently introducing incompatible approaches.

## 10. Technology and dependencies

The project currently uses Next.js, React, TypeScript and Tailwind CSS.

Do not install a commerce backend, authentication system, database, AI service or additional package without:
- Explaining why it is needed.
- Checking compatibility with the existing project.
- Identifying relevant costs or external requirements.
- Explaining any important security implications.
- Obtaining approval for significant changes or paid services.

Technology choices documented in the architecture remain provisional until validated.

## 11. Credentials and privacy

Never:
- Publish private API keys.
- Put secret credentials in browser code.
- Store passwords in plain text.
- Store raw payment-card data.
- Disable Windows security to bypass an installation problem.
- Upload private customer information into public repositories.
- Collect body photographs without an appropriate consent and privacy process.

Use test credentials and test data during development.

Production credentials must be handled securely.

## 12. Commerce and payment integrity

The application must not trust the browser alone to confirm payments.

Inventory updates, order creation and payment status must use secure backend logic and appropriate provider verification.

Never enable real payments or represent a test transaction as a real purchase.

Do not invent payment-provider approval, shipping prices, delivery times or business details.

## 13. Design consistency

Follow `docs/DESIGN_SYSTEM.md`.

Before adding a new component:
- Check whether an existing component can be reused.
- Use the approved colour palette, typography and spacing.
- Keep desktop and mobile layouts consistent.
- Preserve accessibility.
- Avoid unnecessary animation and heavy assets.

Review the result in the browser rather than relying only on code inspection.

## 14. Documentation updates

When an important decision changes:
- Update the relevant documentation.
- Record which options were considered.
- Explain why the decision was made.
- Update the roadmap when tasks are completed.

Never mark a roadmap task complete until its completion criteria have been met.

## 15. Required response format for development tasks

At the end of a development task, provide:

### Summary
Explain what changed in simple language.

### Files changed
List the files created, edited or removed.

### Tests
Report which checks were run and their actual results.

### How to verify
Give clear instructions for checking the result in VS Code or the browser.

### Remaining issues
List known errors, limitations or unfinished work.

### Next step
Suggest one appropriate next task without implementing unrelated features.

## 16. Final principle

Build ANFA ATHLETICS deliberately.

Protect working code, test changes, use one shared architecture, and prefer small verified improvements over large untested code-generation tasks.
