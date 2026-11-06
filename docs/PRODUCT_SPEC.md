# ANFA ATHLETICS — Product Specification

**Project:** ANFA ATHLETICS  
**Document:** Product requirements and feature plan  
**Status:** Initial specification — not all features are implemented  
**Primary launch market:** Morocco  
**Primary currency:** MAD (Moroccan dirham)  
**Languages planned:** French, Arabic and English

## 1. Vision

ANFA ATHLETICS is a premium athletic apparel brand based in Morocco. Its digital platform should combine an exceptional online shopping experience with personalized digital features.

The experience should feel premium, modern, minimal, technical and industrial. It should be simple enough for people of different ages and levels of technical ability to use comfortably.

The goal is to build a custom website first and a mobile application later, using a shared backend so products, accounts, inventory, orders, avatars and saved outfits remain synchronized.

## 2. Core principles

- Make the experience visually distinctive and recognizably ANFA.
- Keep navigation simple and shopping fast.
- Design for desktop, tablet and mobile.
- Make advanced features optional rather than barriers to shopping.
- Reuse established, secure commerce infrastructure where sensible.
- Build features in small, testable steps.
- Do not claim that an unfinished feature works.
- Protect customers' personal information.
- Never store payment-card details directly in the ANFA database.
- Use real product information and verified delivery and payment arrangements.

## 3. Brand and visual identity

The visual direction is Raw Luxury and Minimal Industrial Technical.

The planned palette includes:
- Matte black.
- Charcoal and concrete grey.
- Tactical olive green.
- Industrial taupe.
- White for contrast and important controls.

The design should use strong typography, clear spacing, high-quality product photography, controlled animations and carefully designed interactive elements.

Avoid generic templates, cluttered layouts, excessive animations and complicated navigation.

The initial collection is FORGED 01.

## 4. Website features

### 4.1 Homepage
- ANFA logo and navigation.
- Hero section with campaign imagery and a strong brand message.
- Links to new arrivals, men's clothing, women's clothing and collections.
- Featured products and collection cards.
- FORGED 01 campaign section.
- Outfit Lab introduction.
- ANFA ID introduction.
- Customer-service information and footer.
- Responsive layouts for desktop, tablet and mobile.

### 4.2 Navigation and discovery
- Clear product categories.
- Search.
- Filters for category, size, colour, price and availability.
- Sorting by new arrivals, price and other relevant options.
- Collection pages and product recommendations.
- Recently viewed products where appropriate.

### 4.3 Product pages
- Product name, description and price.
- High-quality images and multiple viewing angles.
- Colour and size selection.
- Stock availability.
- Size guide.
- Fabric composition and care instructions when verified.
- Product fit description.
- Add-to-cart control.
- Wishlist.
- 3D viewing and virtual try-on when available.
- Related products.
- Clear shipping, returns and purchase information.

### 4.4 Shopping and checkout
- Cart with editable quantities and variants.
- Accurate prices and stock.
- Discount codes where supported.
- Shipping fees shown clearly.
- Secure checkout.
- Order confirmation.
- Order history and tracking.
- Guest checkout where supported.
- Refund and return workflows.

### 4.5 Collections and campaigns
- Dedicated landing pages for each collection.
- Collection photography and stories.
- New-release announcements.
- Scheduled launches and countdowns when appropriate.
- Early access for eligible members when this feature is implemented.

## 5. ANFA ID and customer accounts

Customers should be able to browse and shop without creating an account.

An optional ANFA ID should provide:
- Secure sign-in and sign-out.
- Customer profile.
- Order history.
- Saved addresses where supported.
- Wishlist.
- Saved outfits.
- Digital wardrobe.
- Avatar profile.
- Personal preferences.
- Account and privacy controls.
- Data deletion options consistent with applicable requirements.

The same identity should work on the website and future mobile application.

## 6. Personal 3D avatar

The customer should be able to create a personalized digital avatar.

Possible creation methods:
- Uploading guided photographs with explicit consent.
- Customizing a starting avatar manually.
- Updating or recreating the avatar later.

The system should support:
- A rotatable 3D body model.
- A clear avatar-creation flow.
- Saved avatar profiles.
- Optional manual appearance adjustments.
- Deletion of photos and avatar data.
- A privacy-friendly option for customers who do not want to upload photographs.

Height, weight and clothing sizes may be optional profile information. The initial product does not require us to estimate every body measurement.

A prototype must validate the chosen avatar technology before a full implementation is promised.

## 7. Virtual fitting room

Customers should be able to select a product and preview it on their digital avatar.

Planned features:
- Select a garment.
- Switch colours and supported sizes.
- Rotate the avatar.
- Change garments.
- Combine tops and bottoms.
- Save a look.
- Add individual products or a complete outfit to the cart.

Garments need appropriate digital 3D assets or a compatible virtual try-on service.

A visual preview must not be presented as proof of exact physical fit. Fit accuracy must be tested before making such claims.

## 8. Outfit Lab

Outfit Lab lets customers create and save complete outfits.

It should support:
- Adding and removing garments.
- Combining tops, bottoms and accessories.
- Changing colours and sizes where available.
- Previewing the look on an avatar when supported.
- Saving outfits to the customer's account.
- Adding the outfit or selected items to the cart.
- Discovering suggested combinations.

The experience should be interactive without making ordinary shopping complicated.

## 9. Digital wardrobe and personalization

Customers should be able to access:
- Saved outfits.
- Wishlist items.
- Previous purchases.
- Recently viewed products.
- Their saved avatar.
- Available complementary products.
- Relevant collection suggestions.

Recommendations should be useful, transparent and not overly intrusive.

## 10. Community and membership

Later features may include:
- Optional public outfit sharing.
- Community-created looks.
- Loyalty rewards.
- Member benefits.
- Early access to collections.
- Launch notifications.
- Customer reviews where appropriate.

Community participation must be optional. Private body avatars and photographs must never become public automatically.

## 11. Administration dashboard

ANFA needs a secure private dashboard for authorized staff.

### Product management
- Create, edit and archive products.
- Upload product photographs.
- Set names, descriptions and prices.
- Manage colour and size variants.
- Set SKU identifiers.
- Define stock quantities.
- Assign products to collections.
- Publish or unpublish products.

### Inventory
- Track stock by product variant.
- Record stock changes.
- Prevent overselling.
- Show low-stock warnings.
- Update availability on the website.

### Orders
- View order details.
- Review payment status.
- Manage fulfilment status.
- Add shipment tracking information.
- Handle cancellation and refund workflows.
- Search and filter orders.

### Customers
- View appropriate customer information.
- Review order history.
- Handle support requests.
- Apply strict access controls to personal information.
- Never expose passwords, secrets or private payment credentials.

### Promotions and content
- Create supported discounts.
- Organize collections.
- Update homepage content.
- Manage campaign information.
- Review product availability.

### Business overview
- Show sales and order totals.
- Display best-selling products.
- Highlight low stock.
- Report relevant business metrics.

The admin dashboard must be private and protected by authentication and role-based permissions.

## 12. Shared backend and synchronization

The website and mobile application must use the same backend.

The shared system should coordinate:
- Product catalog.
- Product variants and prices.
- Inventory.
- Customer accounts.
- Orders.
- Payment status.
- Fulfilment and tracking.
- Saved outfits.
- Avatar profiles.
- Customer preferences.
- Relevant notifications.

Changes made in the administration dashboard should propagate to the storefront through secure APIs.

The system must handle concurrent purchases safely so stock cannot be oversold.

## 13. Future mobile application

A later iOS and Android application should provide the main website features, adapted for mobile.

It should include:
- Customer accounts.
- Product browsing and search.
- Shopping cart and checkout.
- Orders and tracking.
- ANFA ID.
- Avatar and virtual try-on.
- Outfit Lab.
- Digital wardrobe.
- Wishlist.
- Notifications where appropriate.
- Membership and community features when available.

The application should share the backend and account identity with the website.

## 14. Growth and customer retention

The platform should encourage discovery, purchasing and repeat visits through:
- Search-engine-friendly pages.
- High-quality campaign content.
- Social media links.
- Shareable product and collection pages.
- Fast mobile performance.
- Helpful product descriptions and size guides.
- Optional email marketing with appropriate consent.
- Relevant new-collection announcements.
- Saved wardrobes and outfits.
- Loyalty benefits when implemented.
- Simple checkout and reliable order updates.

Measure visits, product engagement, cart additions, conversion, repeat purchases, returns and customer satisfaction.

## 15. Languages and accessibility

French is the planned initial language.

Arabic and English are planned for future support.

The design should support:
- Proper right-to-left layout for Arabic.
- Readable text and contrast.
- Keyboard navigation where appropriate.
- Clear error messages.
- Accessible buttons and forms.
- Mobile-friendly controls.
- Simple instructions and consistent navigation.

## 16. Security and privacy

- Protect all private API keys and secrets on the server.
- Use secure authentication and authorization.
- Restrict administration access.
- Validate user input.
- Protect against unauthorized access and common web vulnerabilities.
- Use a reputable payment provider.
- Do not store raw payment-card details.
- Request consent before processing body photographs.
- Collect only necessary personal data.
- Define retention and deletion rules for photographs and avatars.
- Make data access and deletion possible as appropriate.
- Configure analytics and cookies with suitable privacy controls.
- Test security before launch.

## 17. Technical approach

The current project uses Next.js, React, TypeScript and Tailwind CSS.

Potential components to evaluate:
- Next.js for the website frontend.
- Medusa or another suitable commerce backend.
- PostgreSQL or a compatible managed database.
- Three.js or React Three Fiber for 3D rendering.
- A secure identity solution.
- A suitable payment provider for an eligible Moroccan business.
- A future mobile application connected to the same backend.

These are proposed technologies, not all finalized decisions. Verify compatibility, cost, hosting, security and Moroccan payment availability before implementation.

Do not add the entire backend or advanced AI features at once.

## 18. Development roadmap

Phase 0: Project documentation, architecture and source control.

Phase 1: Responsive visual prototype and homepage.

Phase 2: Collections, product pages and navigation.

Phase 3: Commerce backend, admin dashboard and inventory.

Phase 4: Cart, checkout, orders and payment integration.

Phase 5: Customer accounts, ANFA ID and saved wardrobe.

Phase 6: 3D avatar prototype and virtual fitting room.

Phase 7: Delivery, returns, notifications, community and membership.

Phase 8: Security, testing, deployment and mobile application.

Each phase must have a working result and be tested before the next phase begins.

## 19. Development rules for AI assistants

Every AI working on this project must:
1. Read the project documentation before implementing a feature.
2. Inspect existing files before changing them.
3. Work on one clearly defined task at a time.
4. Avoid replacing working features unnecessarily.
5. Explain which files it changes.
6. Run suitable checks and report their actual results.
7. Never claim a feature works without testing it.
8. Never expose secrets or weaken security controls.
9. Ask before making destructive changes.
10. Update documentation when an agreed design or architecture changes.

Use Git commits or other verified checkpoints before significant changes.

## 20. Definition of success

ANFA is ready to launch only when:
- The website works on desktop and mobile.
- Product information and stock are accurate.
- Accounts and administration are protected.
- Cart and checkout work correctly.
- Payments have been tested with the selected provider.
- Delivery and returns reflect real business arrangements.
- Customer data is protected.
- The website has been tested for usability, accessibility and performance.
- Any advertised 3D and virtual try-on features work as described.
- The website and future app can share customer and commerce data securely.

This document describes the intended product. It is not a claim that all features are already implemented.

## Final principle

Build ANFA ATHLETICS as a distinctive premium shopping experience first, establish reliable commerce foundations, then implement advanced personalization and 3D experiences in tested stages.