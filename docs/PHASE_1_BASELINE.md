# Phase 1 — Local Baseline Verification

This is the manual portion of Phase 1. Tasks 1.2–1.4 (documentation) are prepared in the accompanying patch. Run these commands in **your actual frontend project**, not in the extracted audit ZIP. The expected local path is:

`C:\Users\Asus ExpertBook 15\Documents\anfa-athletics-website`

Task 1.1 (Git checkpoint/restore point) is intentionally deferred, per the owner's request.

## 1. Check root configuration files

Open a new PowerShell window and paste:

```powershell
Set-Location "$env:USERPROFILE\Documents\anfa-athletics-website"

$files = @(
  "package.json",
  "tsconfig.json",
  "package-lock.json",
  "eslint.config.mjs",
  "eslint.config.js",
  ".eslintrc.json",
  ".gitignore",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  ".env.local"
)

foreach ($file in $files) {
  "{0,-24} {1}" -f $file, (Test-Path $file)
}
```

This prints only whether a file exists. It does **not** print environment contents or secrets. A project needs one valid ESLint configuration style, not all three options; a lockfile should match the package manager you use. `next.config.*` may be intentionally absent if defaults are sufficient.

## 2. Run ESLint

In the same frontend PowerShell window:

```powershell
npm.cmd run lint
```

Wait for it to finish. Copy the actual terminal output if it reports errors or warnings. Do not edit `.next` generated files to fix source errors.

## 3. Run a production build

After lint finishes, run:

```powershell
npm.cmd run build -- --webpack
```

Use the webpack flag because that has been the known local workaround in this project. If the actual Next.js CLI rejects the flag, send the exact output instead of guessing at another command.

A successful build is useful but doesn't replace browser/API tests.

## 4. Smoke-test the working routes

In the browser, check:

1. `/` loads.
2. `/collections` loads, and a product opens.
3. The product page can select its available presentation variants without displaying incorrect facts.
4. `/cart` shows the selected items and quantity controls behave correctly.
5. `/checkout` allows the signed-in customer to select a saved address, prefill the email and delivery fields, and submit those details to the cart. Confirm the shipping state is truthful when options aren't configured. The order button must remain disabled.
6. `/account` can log in and log out.
7. `/account/profile` saves the customer's name/phone.
8. `/account/addresses` can create, edit and delete an address.
9. `/wishlist` persists changes and doesn't duplicate the same product/variant.
10. `/account/forgot-password` makes a reset request; the local backend emits a reset link.
11. `/account/reset-password` accepts a fresh link, updates the password, and the new password can log in.

Don't repeatedly request reset links unless testing; a newer reset can make an earlier token unusable.

## 5. Check secret-file handling without displaying secret contents

Do not paste `.env.local` or backend `.env` contents into chat. Confirm those files are not included in any uploaded archive or public repository. If `.gitignore` exists, ensure appropriate patterns are present for environment files and local build/dependency artifacts, while keeping a safe example template if desired.

## 6. Report back

Send one of these:

- `Lint passes; build passes` (only if both actually pass), or
- the complete error output from whichever command fails.

Also send the root config-file existence output from step 1. The output contains only file names and True/False values, not secrets.
