# Claude Handoff — ANFA ATHLETICS
Updated: 2026-11-06

Read this before proposing changes. Then inspect the current repository files and git status. This document is a handoff, not proof that every feature mentioned below is currently deployed. Treat the checked-in code and actual local files as the source of truth.

## The user and working style

The user is building ANFA ATHLETICS, a premium athleticwear brand based in Casablanca, Morocco. Brand identity: “Raw Luxury” / minimal industrial / technical athleticwear. Collection: FORGED 01. Brand signature: “Forgé à Casablanca. Conçu pour l’Élite.”

The user wants a premium, accurate result, not merely a successful build. They are frustrated by a 3D clothing workflow that repeatedly exported technically valid meshes that did not resemble the actual products. Be honest about uncertainty. Never call a model “finished” because it exports or passes a file audit; the visual match is essential.

Working preferences:
- Inspect the actual current files before changing them; don't rely on old snippets or assumptions.
- Prefer small, targeted changes that preserve working functionality. Do not replace whole files/projects unnecessarily.
- Make a backup before replacing generated or important files.
- Clearly distinguish what was tested from what was only reasoned about or syntax-checked.
- Give Windows PowerShell commands that can be copied and pasted. The user does not manually rename downloaded files; commands should copy a versioned download into the correct destination filename.
- Avoid making the user run repeated builds/refreshes that won't solve the underlying issue.
- Do not commit or reveal .env files, API keys, access tokens, production credentials, or other secrets.
- Keep the tone warm, direct, practical, and respectful. Don't be defensive about previous failed attempts.

## GitHub repositories checked for this handoff

1. Website: https://github.com/KAMIL-HAITAM/anfa-athletics-website
   - Default branch seen in GitHub: master.
   - package.json identifies Next.js 16.4.3, React 19.3.0, Medusa SDK/types.
   - app/outfit-lab/page.tsx is present. It merges local products from data/products with live results from getStorefrontProducts(), then renders components/OutfitLabBuilder.
   - components/OutfitLabBuilder.tsx is present and contains the existing 2D product/variant/size/cart-builder flow.
   - Important checked finding: the GitHub default branch did NOT contain components/OutfitLab3DView.tsx, and the checked-in OutfitLabBuilder.tsx contained no 3D/CharacterCreator integration. Code search also found no CharacterCreator reference. Therefore, the latest local 3D experiments may not be committed or available to Claude through this repository. Verify branches and local git status before editing.
   - README.md is still the standard create-next-app boilerplate and should be improved later, but this is not the immediate priority.

2. Commerce backend: https://github.com/KAMIL-HAITAM/anfa-commerce-backend
   - Default branch seen in GitHub: main.
   - A Medusa 2.22.1 Turbo monorepo, Node engine >=22.23.4.
   - Creator-program routes/modules/workflows exist in the checked-in repo. Inspect the actual commission and delivery files rather than assuming every previously attempted lifecycle case is correct.
   - Keep backend changes isolated from the garment-model work.

3. Local 3D project:
   - Windows path: C:\Users\Asus ExpertBook 15\Documents\anfa-charactercreator
   - It is a separate local clone of https://github.com/kblood/CharacterCreator.
   - It was NOT among the repositories listed under the user's GitHub account when this handoff was prepared. Claude will not be able to inspect its local modifications, generated models, or Blender scripts until the project is made available through GitHub or files are uploaded.
   - Do not imply the local 3D folder is already synced to the user's GitHub. Help the user make a separate PRIVATE repository for this project, or ask them to grant Claude access to an existing private fork if they have one. Before pushing, review .gitignore and avoid uploading large transient build/mh_assets directories or secrets; decide deliberately which generated GLB assets are needed for reproducible preview.
   - The local project uses Blender 5.2.3 LTS and MPFB 2. Generated MakeHuman assets were fetched into build/mh_assets. The standalone viewer uses Three.js; serve it over HTTP, not file://.

## Website state and constraints

- The user has an existing product catalogue of 27 items, with local data and live Medusa merge.
- The 2D Outfit Lab builder is an existing, important piece of functionality. The user previously confirmed product selections and adding both selected pieces to the cart worked. Preserve this unless the user explicitly asks for a redesign.
- A previous restrictive fields query caused the product catalogue to disappear; the user restored the no-fields-query approach. Do not reintroduce restrictive Medusa product fields without verifying all mapped properties and running the site.
- The frontend package scripts include dev, build, start, and lint. Use the repo's current lockfile and package manager; verify rather than assume.
- Do not confuse the standalone CharacterCreator preview at localhost:8000 with the ANFA website at localhost:3000. They are separate apps.
- Check actual working-tree changes before replacing anything. Some local code may be newer than GitHub.

## Commerce and fulfilment state — treat as not production-ready until verified

- Morocco/MAD region is configured in the local project history. Previously noted region ID: reg_01M5ZS40Q027QDGECE9TRSJBBH. Confirm it against current backend/database state before using it.
- Real checkout/payment/shipping remains unfinished: Medusa cart sync was intentionally disabled during pre-launch work; payment provider is still a placeholder (System/DEFAULT); shipping quotes, live inventory and payment-provider configuration need completion/testing.
- Do not enable real order creation, production payment or customer-facing checkout just because catalogue or creator-program routes work.
- Creator-program activate/deactivate UI and promotion status were previously tested successfully.
- Commission rules agreed with the user: commissionable base is eligible product subtotal after discounts, excluding shipping; pending when an order is placed; approved only when the order is delivered and paid; voided on cancellation; partial refunds proportionally reduce commission; payouts are managed manually. These rules are the intended behavior, not a guarantee every edge case is implemented correctly. Inspect source/tests and test each lifecycle case.
- A historical test commission of 34.06 MAD on 227.05 MAD eligible subtotal at 15% was later associated with a cancelled test order. It is not a real payout/earning.
- Glovo work is foundational/incomplete: tracking/manual delivery confirmation exists in project history, but live dispatch, credentials, webhook verification and end-to-end tests remain pending.
- Search Git history and deployments for any accidentally committed .env or credentials. Rotate real keys if any were exposed; never paste them into this handoff.

## 3D Outfit Lab — exact current situation

### Intended product references
The user already has design reference/asset files in ChatGPT history/library, but they may not be in GitHub yet:
- ANFA Forged 01 T-Shirt Catalog.png
- ANFA Athletics Heavyweight Jogger Lookbook.png
- ANFA Athletics Seamless Leggings Lookbook.png
- ANFA Athletics Activewear Asset Catalog.png
- ANFA Technical Sports Bra Collection.png
- ANFA Outfit Lab Storyboard(1).png
- ANFA Outfit Lab: Complete UI Journey.png
- ANFA Athletics Forged 01 Lookbook.png

Use the actual reference images rather than inventing a substitute design. The Core Form T-shirt is intended to be a boxy/oversized crew-neck tee with dropped shoulders, washed-vintage black option, subtle tonal ANFA mark on the upper chest, real garment drape and a clean hem. Architectural Rib leggings are high-waisted, full-length, smooth-knit leggings with distinct raised/ribbed outer-leg panels and understated ANFA branding. These are not jeans or generic straight trousers.

### Failed approaches — do not repeat
- A procedural primitive mannequin built from spheres/cylinders was rejected.
- A generated garment “shell” cut from body-surface faces produced jagged neck/sleeve/hem boundaries and holes at crotch/ankles. Multiple versions of blender/tools/build_anfa_garments.py were attempted. A skinning audit was eventually fixed, but visual quality remained poor. Do not use this body-shell technique as the final garment construction.
- A conversion from the original clothing_shirt.glb (a long-sleeved/collared shirt) into a tee made a polo/open-collar-looking shirt, not the real Core Form design. The original jeans mesh stayed visually like plain trousers. Do not mistake export success for design fidelity.
- Do not continue making users run blind generator iterations. First diagnose the current Blender script and reference design, then propose a controlled mesh-editing/garment-construction method and inspect a render before asking for another run.

### Latest local 3D result and what actually passed
- A full native CharacterCreator rebuild completed successfully in the user's Windows project. In its log it exported the human, native garment catalogue and hair assets; it produced output/clothing_tshirt.glb and output/clothing_jeans.glb. (Before that native rebuild, the user did not have clothing_tshirt.glb; the native build created it.)
- A subsequent local conversion produced output/clothing_anfa_core_form_tee.glb and output/clothing_anfa_architectural_rib_leggings.glb and updated output/clothing.json with IDs anfa_core_form_tee and anfa_architectural_rib_leggings.
- The conversion's GLB audit reported skins=1, skinned=True, targets=92; all vertices were weighted in the logged audit. That verifies basic file/skeleton integrity only, not good fit, correct garment anatomy, or design resemblance.
- A follow-up detail script was run. Latest screenshot shows a black oversized crew-neck tee, with a tiny low-contrast ANFA logo placed too low/near mid-chest, broad sleeve shape unlike the target, and plain straight black trousers without visible Architectural Rib detail; the model is barefoot. The user explicitly said: “that doesnt look at all like my t-shirt.”
- Backups exist locally from prior runs, including a folder matching build/backups/before-native-tshirt-* and files named clothing_anfa_core_form_tee.pre_original_mesh_build.glb, clothing_anfa_architectural_rib_leggings.pre_original_mesh_build.glb, and clothing.json.pre_original_mesh_build.json. Preserve these and inspect before overwriting.
- The last successful pipeline used build_anfa_from_native_tshirt.py and build_anfa_finish_details.py in blender/tools. These scripts were generated iteratively and have not been verified as committed to the user's GitHub. Treat them as experiments, inspect the exact local files before reusing.
- Current standalone preview staging path: build/site. Typical refresh copies output/*.glb and output/*.json to build/site then refreshes localhost:8000. Do not do this again until a real geometry change is ready; a refresh alone will not improve the shape.

### Recommended next 3D workflow
1. Get the local anfa-charactercreator project into a private GitHub repo so the actual Blender scripts, manifest and outputs are available to Claude. Review git status and ignore rules first. Keep secrets and large transient build assets out; deliberately include required source scripts, catalog, reference images, and only the GLB assets needed to reproduce the preview.
2. Inspect the exact conversion script(s), output manifest entries, original clothing meshes, and design references. Identify whether shirt neckline, sleeves, hem and rib details are modeled, UV/material based, or accidentally lost during conversion.
3. Develop a visual test workflow that renders front, side, and back comparison images against the references.
4. Fix one garment at a time. The likely direction is to start from the native rigged T-shirt mesh (not clothing_shirt.glb) and create actual shape changes/pattern-like geometry for the oversized tee; for leggings, create distinct rib panel geometry/textures and a proper high waistband. Preserve working skinning, but re-audit joints/weights and shape-key compatibility after changes.
5. Do not integrate into the ANFA website until the standalone garment appearance is approved by the user. Keep the 2D builder working throughout.
6. Use explicit checkpoints and concise diffs; don't run a full Blender body rebuild for every detail change.

## Important open issues
- Latest local 3D work is not yet confirmed in the user's GitHub. Checked default website branch has no OutfitLab3DView/CharacterCreator references.
- Need make the separate anfa-charactercreator project visible to Claude via a private GitHub repo.
- Actual ANFA garment geometry remains unsatisfactory; do not say this is finished.
- Live checkout, payments, shipping, inventory and real Glovo dispatch/webhooks remain pre-launch tasks.
- Verify all commission lifecycle cases against tests/source.

## Suggested first message for Claude after GitHub access is connected

“I’m taking over ANFA ATHLETICS. Read CLAUDE_HANDOFF.md in the website repo and the backend handoff. First inspect both repos, branch names, recent commits, and working-tree state; do not edit code yet. Confirm which local 3D files are absent from GitHub and help me safely make my separate anfa-charactercreator project available through a private repo. Then inspect the existing Outfit Lab and actual product reference images. Do not repeat the body-surface shell approach. My top priority is accurate Core Form tee and Architectural Rib leggings geometry, validated visually before integrating into the website. Preserve the working 2D builder and don't make checkout live until it's fully tested.”
