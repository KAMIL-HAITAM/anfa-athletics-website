# ANFA ATHLETICS — Master Development Roadmap

**Last updated:** 29 October 2026  
**Current execution stage:** Phase 1 — Project baseline and documentation  
**Launch status:** Pre-launch; real orders and live payments are intentionally disabled.  
**Checkpoint note:** The owner asked to defer the Git checkpoint task for now. Do not represent it as complete.

## How to use this roadmap

- `[x]` = implemented and verified by the owner, or confirmed from the inspected source where explicitly noted.
- `[~]` = partially implemented, source-inspected, or awaiting a local test/business decision.
- `[ ]` = not yet completed.
- A checked item does not imply production readiness. Local development, backend-connected, and production-tested are different levels.
- When code has changed since the last audit ZIP, re-check the actual local project before applying a patch.
- Never invent product data, inventory, shipping prices, payment approval, or delivery commitments.
- Keep real checkout/order submission disabled until all launch gates pass.

## Current status at a glance

| Area | Status | Notes |
|---|---|---|
| Next.js storefront | `[~]` | Pages and styling exist; run lint and production build in the local project. |
| Medusa catalogue | `[~]` | Store API integration is present; 27 products were previously reported by the owner. Audit variant completeness and live data again. |
| Cart | `[~]` | Local persistence and Medusa sync code exist; inventory errors have occurred for variants without configured stock. |
| Checkout | `[~]` | Address update and shipping-option lookup work in development; Morocco shipping options are not finalized and order submission remains disabled. |
| ANFA ID authentication/profile | `[x]` | Owner has tested login, logout, profile editing, avatar updates and the password-reset flow. |
| Saved addresses | `[x]` | Owner tested adding and deleting an address; checkout can prefill a saved address. Continue regression testing. |
| Wishlist | `[x]` | Owner reported variant-specific wishlist and customer-account sync working. Cross-device test should still be part of pre-launch QA. |
| Password reset notifications | `[~]` | Development flow works through the local notification provider/backend terminal; real email delivery is not configured. |
| Shipping, payments, orders | `[ ]` / `[~]` | Commercial arrangements and production integrations are still outstanding. |
| Git checkpoint | `[ ]` | Explicitly deferred by owner; no claim that Git history/checkpoint exists. |
| Local quality checks | `[ ]` | Run `npm.cmd run lint` and `npm.cmd run build -- --webpack` in the actual frontend folder. |

---

# PHASE 1 — Project baseline and documentation

**Goal:** Establish an accurate project description, a documented current architecture, and a repeatable local verification routine before adding further features.

### Tasks

- [ ] 1.1 — Create/verify a Git checkpoint and restore point. **Deferred by the owner; do not mark complete.**
- [x] 1.2 — Replace the stale Phase 0 roadmap with a status-based roadmap that reflects the current project.
- [x] 1.3 — Update the architecture document to describe actual code and clearly label future plans.
- [x] 1.4 — Add `docs/PROJECT_STATUS.md` and `docs/PHASE_1_BASELINE.md` to record the current implementation and manual verification plan.
- [ ] 1.5 — In the actual local checkout, confirm root project files exist: `tsconfig.json`, ESLint configuration, `package-lock.json` (or the project's intentionally selected lockfile), `.gitignore`, and any Next.js configuration the project uses. The supplied ZIP did not include these files, so their local existence has not been verified.
- [ ] 1.6 — Run the frontend lint command and production build locally; record the actual results.
- [ ] 1.7 — Manually smoke-test homepage, collections, product page, cart, checkout address selection, ANFA ID, address book, wishlist, forgot-password and reset-password routes after the checks.
- [ ] 1.8 — Confirm `.env.local` and backend `.env` are excluded from any repository/ZIP and no secret values are committed. Do not paste secret contents into chat.
- [ ] 1.9 — Record the actual local test results and remaining errors in `docs/PROJECT_STATUS.md`.

### Completion criteria

- The documentation describes the current implementation rather than the original prototype stage.
- The local project configuration and lockfile are verified.
- Lint and production build results are known, with genuine errors fixed or listed.
- Core existing user journeys still work after the local test run.
- Secret files remain private.
- Git checkpoint is explicitly marked deferred until the owner chooses to do it.

**Do not begin broad product/cart rewrites until this phase is closed.**

---

# PHASE 2 — Product catalogue and variant accuracy

**Goal:** Ensure every storefront product maps to correct Medusa data and does not imply unconfirmed availability.

- [ ] 2.1 — Audit all 27 intended ANFA products in Medusa Admin against the launch catalogue.
- [ ] 2.2 — Verify handles, titles, descriptions, product IDs and collection assignments.
- [ ] 2.3 — Verify every intended colour-size combination and its real Medusa variant ID.
- [ ] 2.4 — Confirm SKUs and variant option values.
- [ ] 2.5 — Finalize prices with the owner/business partner and set real values in Medusa; never invent prices.
- [ ] 2.6 — Validate product images, order, alt text, colour match and mobile gallery behavior.
- [ ] 2.7 — Fill material, fit, construction, care and size-guide data only when verified.
- [ ] 2.8 — Test product edits in Medusa Admin and confirm the storefront updates.
- [ ] 2.9 — Verify unavailable or incomplete variants are not presented as purchasable.

**Completion criteria:** Catalogue content, price and variant selections are accurate; missing commercial facts remain clearly unconfirmed.

# PHASE 3 — Cart, inventory and checkout integrity

**Goal:** Make cart calculations and availability safe before payment integration.

- [ ] 3.1 — Test add, remove, quantity update, clear-cart and persistence behaviors.
- [ ] 3.2 — Validate local product/variant identifiers against Medusa product and variant IDs across the whole journey.
- [ ] 3.3 — Verify cart line items and calculated prices come from trusted Medusa responses.
- [ ] 3.4 — Resolve inventory-policy behavior for unstocked variants without creating fake inventory.
- [ ] 3.5 — Test missing price, unavailable item, stock change and cart refresh scenarios.
- [ ] 3.6 — Test selected saved address prefill and submission to the Medusa cart.
- [ ] 3.7 — Test shipping-option retrieval and clear errors when no option is available.
- [ ] 3.8 — Keep final order submission disabled until order, inventory, shipping and payment requirements are met.

**Completion criteria:** Cart totals/variants are trustworthy, availability is truthful, and checkout does not imply that an order has been placed.

# PHASE 4 — Shipping, fulfilment and customer policies

- [ ] 4.1 — Choose the actual courier/delivery service and define serviceable areas.
- [ ] 4.2 — Obtain and approve real shipping rates and delivery estimates.
- [ ] 4.3 — Configure Medusa shipping profiles, regions, fulfilment provider and shipping options as appropriate.
- [ ] 4.4 — Test shipping prices and eligibility for representative Moroccan addresses.
- [ ] 4.5 — Define packing, dispatch, tracking, failed-delivery and customer-support procedures.
- [ ] 4.6 — Finalize accurate returns, exchanges, cancellation and refund policies.
- [ ] 4.7 — Publish contact/support, shipping, returns, privacy and terms pages as applicable.
- [ ] 4.8 — Ensure the footer and checkout link to the relevant customer information.

**Completion criteria:** All delivery and policy content reflects approved real-world arrangements.

# PHASE 5 — Payment and real orders

- [ ] 5.1 — Compare providers that support the actual business setup and transactions in Morocco.
- [ ] 5.2 — Confirm onboarding/merchant eligibility, fees, settlement and supported methods.
- [ ] 5.3 — Complete provider onboarding and use its test environment.
- [ ] 5.4 — Integrate the chosen provider with Medusa's payment workflow.
- [ ] 5.5 — Verify payment status server-side through the provider-supported method.
- [ ] 5.6 — Create orders through a trusted backend workflow and prevent duplicate processing.
- [ ] 5.7 — Test successful, declined, abandoned, interrupted and duplicate-callback cases.
- [ ] 5.8 — Test stock reservations, order cancellation and refunds.
- [ ] 5.9 — Confirm ANFA does not store raw payment-card details.
- [ ] 5.10 — Keep live payments off until business and technical approval is complete.

**Completion criteria:** Test purchases produce correct payment and order state without overselling or duplicate orders.

# PHASE 6 — Transactional email and notifications

- [x] 6.1 — Implement a development password-reset request/token flow (owner-tested locally).
- [x] 6.2 — Implement the reset page and verify login with the new password (owner-tested locally).
- [ ] 6.3 — Select and configure a real transactional email provider.
- [ ] 6.4 — Verify the production sender domain and deliverability.
- [ ] 6.5 — Replace terminal-only reset links with actual password-reset emails.
- [ ] 6.6 — Create and test branded reset, order confirmation, payment and fulfilment templates.
- [ ] 6.7 — Test failed notification delivery and retries/monitoring.

**Completion criteria:** Customer emails reach real inboxes and their links use the correct production domain. The local notification provider is development-only.

# PHASE 7 — ANFA ID hardening and order history

- [x] 7.1 — Sign-in, sign-out and registration flow exists (owner-tested).
- [x] 7.2 — Profile name/phone editing exists (owner-tested in development).
- [x] 7.3 — Avatar add/remove exists (owner-tested).
- [x] 7.4 — Saved addresses can be created, edited and deleted (owner-tested).
- [x] 7.5 — Saved addresses can prefill checkout (owner-tested).
- [x] 7.6 — Wishlist supports local guest state and account metadata sync (owner reported working).
- [ ] 7.7 — Implement order history and order-detail access once real orders work.
- [ ] 7.8 — Test strict customer authorization and cross-account isolation for profile, addresses, wishlist and orders.
- [ ] 7.9 — Decide and implement account email-change/verification behavior where appropriate.
- [ ] 7.10 — Define account deletion, data retention and privacy controls.
- [ ] 7.11 — Review avatar storage/size/retention for production.
- [ ] 7.12 — Test wishlist login/logout transitions and cross-device persistence.

**Completion criteria:** Account functionality persists correctly and no customer can access another customer's private data.

# PHASE 8 — Storefront discovery and content

- [ ] 8.1 — Implement functional product search.
- [ ] 8.2 — Implement useful filters (size, colour, price and availability as supported by verified data).
- [ ] 8.3 — Add relevant sorting and confirm it behaves correctly.
- [ ] 8.4 — Review brand story, contact, campaign and collection content.
- [ ] 8.5 — Add related/recently viewed products only where useful.
- [ ] 8.6 — Remove placeholder content that would confuse customers at launch.

# PHASE 9 — Visual QA, accessibility and performance

- [ ] 9.1 — Review homepage, header/footer and collection/product pages on desktop, tablet and mobile.
- [ ] 9.2 — Review cart, checkout, login, profile, addresses, wishlist and reset states at common viewport sizes.
- [ ] 9.3 — Normalize spacing, typography, alignment and component interactions against `DESIGN_SYSTEM.md`.
- [ ] 9.4 — Test keyboard operation, visible focus, labels, form errors, readable contrast and reduced-motion preference.
- [ ] 9.5 — Optimize large campaign/category images and verify responsive image loading.
- [ ] 9.6 — Review page metadata, sharing images, sitemap, robots and canonical URLs as appropriate.
- [ ] 9.7 — Add analytics only with a clear purpose and appropriate privacy/consent behavior.
- [ ] 9.8 — Run mobile performance and error-state tests.

# PHASE 10 — Production, security and launch

- [ ] 10.1 — Choose hosting, database hosting and production architecture.
- [ ] 10.2 — Configure the domain, HTTPS and public storefront URL.
- [ ] 10.3 — Configure production secrets without exposing them to client code or source control.
- [ ] 10.4 — Set production CORS, cookie/session and authentication settings.
- [ ] 10.5 — Audit authorization, input validation, rate limiting and dependency security.
- [ ] 10.6 — Configure logs, error monitoring, backups and recovery procedures.
- [ ] 10.7 — Run a production build and smoke test in the actual deployment environment.
- [ ] 10.8 — Run full end-to-end tests from product to fulfilment notification.
- [ ] 10.9 — Confirm prices, inventory, delivery terms and policies are approved.
- [ ] 10.10 — Complete launch sign-off before enabling real customer orders.

**Launch gate:** Do not launch solely because the pages look complete. Real products, inventory, shipping, payment, order creation, email, privacy and deployment must be verified.

# PHASE 11 — Post-launch product vision

These are intentionally deferred until the core store is reliable and the launch scope is agreed.

- [ ] 11.1 — Research avatar providers and build one narrow proof of concept.
- [ ] 11.2 — Obtain/prepare a 3D garment asset and test a limited virtual garment preview.
- [ ] 11.3 — Prototype the Outfit Lab and save/retrieve an outfit.
- [ ] 11.4 — Evaluate fit accuracy and communicate limitations clearly.
- [ ] 11.5 — Add secure customer wardrobe/personalization data with consent and deletion controls.
- [ ] 11.6 — Evaluate reviews, loyalty, community, advanced retention and analytics.
- [ ] 11.7 — Evaluate a native iOS/Android app sharing the existing backend.

# Definition of done

A task is complete only when the change exists in the actual project, the expected behavior is tested, errors are resolved or documented, and relevant documentation is updated. User-reported testing is recorded as such; tests not actually run must not be presented as passed.
