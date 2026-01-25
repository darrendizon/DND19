## 2024-05-23 - Keyboard Shortcuts for Dynamic Actions
**Learning:** Adding keyboard shortcuts (1-9) to dynamically generated action buttons significantly improves playability for keyboard users. Visual hints (e.g. `[1]`) are crucial for discoverability.
**Action:** When generating lists of interactive elements, always consider mapping them to number keys and displaying the shortcut visually.

## 2024-05-24 - Reusable Toast Notification Pattern
**Learning:** Native `alert()` dialogs break immersion and block the main thread. Replacing them with non-blocking, accessible toast notifications (using `role="alert"`) provides a seamless "high fantasy" experience without disrupting gameplay flow.
**Action:** Use the `showToast()` helper function with Tailwind classes for all in-game notifications instead of browser alerts.
