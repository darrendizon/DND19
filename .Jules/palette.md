## 2024-05-23 - Keyboard Shortcuts for Dynamic Actions
**Learning:** Adding keyboard shortcuts (1-9) to dynamically generated action buttons significantly improves playability for keyboard users. Visual hints (e.g. `[1]`) are crucial for discoverability.
**Action:** When generating lists of interactive elements, always consider mapping them to number keys and displaying the shortcut visually.

## 2024-05-24 - Reusable Toast Notification Pattern
**Learning:** Native `alert()` dialogs break immersion and block the main thread. Replacing them with non-blocking, accessible toast notifications (using `role="alert"`) provides a seamless "high fantasy" experience without disrupting gameplay flow.
**Action:** Use the `showToast()` helper function with Tailwind classes for all in-game notifications instead of browser alerts.

## 2024-05-25 - Semantic Progress Bars for Vitals
**Learning:** Visual-only health bars leave screen reader users guessing about critical game state. Using `role="progressbar"` with `aria-valuenow` transforms these elements into semantically rich indicators that AT can interpret as "Health Points: 42%".
**Action:** Always wrap visual status bars in a container with `role="progressbar"` and keep `aria-valuenow` synchronized via JavaScript.

## 2024-05-26 - Accessible Disabled States
**Learning:** Fully removing disabled buttons from the tab order (using `disabled` attribute) can confuse keyboard users who rely on position memory or want to know why an option is unavailable.
**Action:** Use `aria-disabled="true"` with visual styling (e.g. `opacity-50`) instead of `disabled` to keep elements focusable, and provide descriptive text explaining the unavailability.

## 2024-05-27 - Preserving Focus Across Dynamic Updates
**Learning:** Re-rendering interactive lists (like action buttons) destroys the focused element, resetting focus to `body` and disrupting keyboard navigation flow.
**Action:** Before clearing a container, capture the `data-key` (or ID) of the `activeElement`. After re-rendering, locate the new corresponding element and call `.focus()` to restore context.
