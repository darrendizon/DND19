## 2024-05-22 - Static Site Verification with Playwright
**Learning:** This repo is a pure static site (no package.json). Standard `pnpm` commands are not available. Verification relies on Python scripts using Playwright.
**Action:** When working on this repo, create custom Python verification scripts using `playwright.sync_api` to test changes, rather than relying on standard npm scripts. Use `file://` protocol to load pages.

## 2024-05-22 - Visual Contrast in Dark Mode
**Learning:** Using text utilities like `text-charcoal` on dark backgrounds (implied by lack of explicit background class) leads to invisible text. Always ensure a high-contrast background class (like `.bg-gold`) is applied when using dark text in a dark mode theme.
**Action:** Always verify contrast of new UI elements, especially buttons, using visual inspection (screenshots) or contrast checking tools. Verify custom utility classes exist before using them.
