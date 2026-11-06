# ANFA ATHLETICS — Technical Architecture

**Last reviewed:** 29 October 2026  
**Status:** Current-state document based on the supplied storefront ZIP and owner confirmations. It is not a substitute for inspecting the latest local checkout before code changes.

## 1. Purpose and implementation status

This document describes the current storefront/backend boundary and separates implemented development functionality from future launch requirements. ANFA ATHLETICS uses a custom Next.js storefront with Medusa v2 for commerce data and customer services.

The store is still in pre-launch development. Real inventory, Moroccan shipping options, payment processing, production email and order workflows are not confirmed ready. Checkout intentionally keeps the final sales button disabled.

## 2. Current project structure

### Storefront

- Framework: Next.js `16.4.3`.
- UI: React `19.3.0`, TypeScript, Tailwind CSS v4 plus extensive custom CSS.
- Commerce SDK: `@medusajs/js-sdk` `^2.22.1`.
- Main frontend root: `C:\Users\Asus ExpertBook 15\Documents\anfa-athletics-website`.
- Known development command: `npm.cmd run dev -- --webpack` (used because of a local Windows/native SWC issue).
- Package scripts in the supplied snapshot: `dev`, `build`, `start`, `lint`.
- The supplied ZIP did not include `tsconfig.json`, a lockfile, ESLint configuration, `.gitignore` or Next config at the root. Their presence in the actual local folder must be checked before claiming the snapshot is directly buildable.

### Backend

- Commerce engine: Medusa v2.
- Main backend root: `C:\Users\Asus ExpertBook 15\Documents\anfa-commerce-backend`.
- Local backend URL: `http://localhost:9000`.
- Medusa Admin URL: `http://localhost:9000/app`.
- Database: PostgreSQL in the local development setup.
- A Morocco/MAD region, default sales channel and Moroccan warehouse have previously been configured.
- The backend's `medusa-config.ts` configures database URL, CORS, JWT and cookie secrets. The local notification module/subscriber were added separately for development password-reset notifications.
- Do not expose `.env`, `.env.local`, JWT secrets, cookie secrets, database credentials or other private configuration values.

## 3. Storefront routes and responsibilities

| Route | Current responsibility | Status/limit |
|---|---|---|
| `/` | Brand homepage and campaign presentation | Implemented; full responsive/content QA remains. |
| `/collections` | Collection discovery/catalogue entry | Implemented; search/filter completeness not verified. |
| `/collections/[collection]` | Collection-specific products | Implemented. |
| `/products/[slugs]` | Product detail, images and variant selection | Implemented; variant mapping and final product facts require audit. |
| `/cart` | Display local cart and item controls | Implemented; prices/availability must be verified against Medusa. |
| `/checkout` | Contact and address form, cart update and shipping-option lookup | Development flow only. No live payment/order submission; Moroccan shipping options are not finalized. |
| `/wishlist` | Display saved product-colour entries | Implemented; uses existing product card and catalogue data. |
| `/account` | Registration, login, logout, dashboard and avatar controls | Owner-tested in development. |
| `/account/profile` | Edit first name, last name and phone | Owner has tested profile-related functionality; email shown read-only. |
| `/account/addresses` | Create, edit and delete customer addresses | Owner-tested in development. |
| `/account/forgot-password` | Initiate password reset | Owner-tested; currently paired with local notification delivery. |
| `/account/reset-password` | Set a new password from a tokenized reset URL | Owner-tested; new credentials successfully used to log in. |

## 4. Product catalogue data flow

- `lib/medusa.ts` configures the Medusa JavaScript SDK from environment variables.
- `lib/medusa-products.ts` fetches Store API products, maps Medusa product and variant details into the storefront's `Product` model, and keeps a local fallback catalogue.
- `app/api/catalog/route.ts` exposes the catalogue to client pages.
- `data/products.ts` defines local presentation/fallback product data and the common product types.
- For the original local product handles, the mapper preserves local product IDs for compatibility. Real Medusa product IDs are represented separately as `medusaProductId`, and actual Medusa variants are represented in `commerceVariants` in the inspected snapshot.
- The owner previously reported that Medusa returned 27 intended ANFA products. Re-audit all products and variant combinations before launch; that historical count is not proof that pricing, stock or every colour/size is ready.

## 5. Cart and checkout data flow

- `components/CartProvider.tsx` keeps the storefront cart in browser storage and synchronizes supported line items with a Medusa cart.
- Local cart records contain product ID, variant ID, size and quantity. Compatibility between local presentation IDs and Medusa IDs must be preserved when changing the cart.
- Checkout loads the catalogue, resolves current line items and displays a summary.
- Address submission updates the Medusa cart's email, shipping address and billing address.
- Checkout then requests eligible shipping options from Medusa. When no Morocco option is returned, the UI reports that shipping has not yet been configured.
- The final order button remains disabled. Do not enable it until stock, server-calculated totals, shipping, payments, order creation, cancellation/refund handling and notification flows are integrated and tested.
- Inventory-related HTTP 400 errors have occurred for variants without the required inventory. Do not resolve these by inventing stock or turning on unintended backorders.

## 6. Customer identity (ANFA ID)

- Customer authentication is handled through Medusa's `customer` / `emailpass` authentication flow.
- Customer profile edits use the Store API customer update flow.
- The avatar is stored as a compressed data URL in customer metadata under `anfa_avatar` in the inspected implementation. This works for a development prototype but should be reviewed for production storage, payload limits, retention and deletion.
- Saved address creation/list/update/delete uses Medusa customer-address endpoints.
- Wishlist entries are variant-specific: `{ productId, variantId }`. Guest/local state uses `anfa-athletics-wishlist`; authenticated account state is synchronized in customer metadata under `anfa_wishlist`, preserving other metadata fields.
- Wishlist sync merges entries and de-duplicates by product/variant key. The owner reported that current wishlist sync works; cross-device and multi-account transition testing remains in pre-launch QA.
- The account profile currently shows email read-only; email-change flow remains a future security task.
- Order history is not implemented yet because the real order workflow is not ready.

## 7. Password recovery and notifications

- The frontend uses Medusa SDK methods to request a reset token and update the provider password.
- Backend subscriber: `src/subscribers/password-reset.ts`, listening for `auth.password_reset`.
- Local notification provider is configured for development and emits the reset URL to backend-terminal notification output rather than delivering email to a real inbox.
- The owner tested the full local flow: request a link, open the link, set a new password, and sign in with the new password.
- The forgot-password page includes a way to make another request without manually reloading the page.
- Before production, configure an approved email provider, sender/domain verification, production `STOREFRONT_URL`, branded templates, delivery monitoring and relevant abuse/rate controls.
- Reset tokens must not be logged or shared publicly outside the controlled local-development context.

## 8. Design and reusable components

- `app/globals.css` contains the custom brand styles and has accumulated targeted overrides during iterative development. Review the final cascade before a large stylesheet cleanup; avoid deleting unknown prior rules.
- Shared components include `SiteHeader`, `SiteFooter`, `ProductCard`, `ProductDetailInteractive`, `ProductSizeGuide`, `CartProvider`, `WishlistProvider`, `WishlistButton` and `CartIndicator`.
- Design direction: Raw Luxury × Minimal Industrial × Technical Athleticwear; black, warm off-white/greige, restrained olive/grey accents and typography with clear hierarchy.
- Desktop and mobile reviews have been performed iteratively, but a full site-wide responsive/accessibility audit remains outstanding.

## 9. Environments and configuration

### Development

- Frontend: `http://localhost:3000`.
- Backend: `http://localhost:9000`.
- Storefront CORS and customer auth CORS are configured through backend environment variables.
- Password-reset notification is local-development only.
- Actual project environment files must stay local and private.

### Production (not yet ready)

Still to decide/configure:
- Production hosting and database.
- Domain, HTTPS and public storefront URL.
- Production email provider and verified sender domain.
- Moroccan payment provider and merchant onboarding.
- Shipping/courier arrangements, shipping options and fulfilment tracking.
- Production secrets, CORS, cookies/session configuration, logs, monitoring and backups.
- Final end-to-end verification before real orders are enabled.

## 10. Security and data rules

- Customer routes/actions must operate only on the authenticated customer and must be tested for cross-account isolation.
- Metadata updates must preserve existing customer metadata, not replace unrelated values.
- Never include admin credentials or secret keys in client-side code.
- Browser state is not authoritative for prices, inventory or payment confirmation.
- Server/backend must be authoritative for order totals and payment status.
- Do not store raw payment-card details.
- Review consent, retention, access and deletion for avatars and future body/wardrobe data.
- Keep real orders disabled until the full operational and technical launch gate passes.

## 11. Development and verification workflow

1. Inspect the current local files before any code change; the audit ZIP may not reflect the latest local edits.
2. Make focused changes and preserve existing working flows.
3. In the frontend root, run `npm.cmd run lint`.
4. In the frontend root, run `npm.cmd run build -- --webpack` (known local workaround; adapt only if the actual Next CLI requires it).
5. Run relevant browser/API smoke tests and report actual results.
6. Update `docs/PROJECT_STATUS.md` and `docs/ROADMAP.md` when implementation or verification state changes.
7. Never claim a check passed if it wasn't run. The Git checkpoint task is currently deferred by the owner.

## 12. Architecture decisions still open

- Production hosting/database strategy.
- Moroccan payment provider and merchant eligibility.
- Courier, rates, delivery timelines and fulfilment procedures.
- Production transactional email provider.
- Account verification/email change and account deletion details.
- Product/variant final data, price and stock state.
- Search/filter scope for the first release.
- Avatar/3D garment/virtual try-on technology and costs.
- Whether/when to build a native mobile app.

## Final principle

ANFA ATHLETICS should be one connected platform, but the ordinary store must be reliable before complex 3D or mobile features are added. Build in small steps, test the actual behavior, record limitations honestly and never enable commerce workflows before the underlying business arrangements are real.
