from playwright.sync_api import sync_playwright
import os
import sys

def verify_skip_link():
    print("Starting verification for Skip Link...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        file_url = f"file://{os.getcwd()}/index.html"
        page.goto(file_url)

        # 1. Verify it is the first focusable element in the DOM
        first_interactive_text = page.evaluate("""() => {
            const focusableSelectors = [
                'a[href]', 'button:not([disabled])', 'input:not([disabled])',
                'select:not([disabled])', 'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ];
            const query = focusableSelectors.join(',');
            const elements = Array.from(document.querySelectorAll(query));
            return elements.length > 0 ? elements[0].innerText : "NONE";
        }""")

        print(f"First focusable element in DOM: '{first_interactive_text}'")

        if "SKIP TO MAIN CONTENT" not in first_interactive_text.upper():
            print("❌ Skip link is NOT the first focusable element.")
            sys.exit(1)

        # 2. Verify functionality (Focus & Activation)
        print("Testing focus and activation...")
        skip_link = page.locator("a[href='#main-content']")
        skip_link.focus()

        # Take screenshot of focused state
        page.screenshot(path="verification/skip_link_focused.png")
        print("Screenshot saved to verification/skip_link_focused.png")

        # Check visibility
        box = skip_link.bounding_box()
        if box['width'] > 1 and box['height'] > 1:
            print("✅ Skip link visible on focus.")
        else:
            print(f"❌ Skip link size unexpected on focus: {box}")
            sys.exit(1)

        # Activating
        page.keyboard.press("Enter")

        # Verify navigation
        focused_id = page.evaluate("document.activeElement.id")
        url_hash = page.evaluate("window.location.hash")

        if focused_id == "main-content" or url_hash == "#main-content":
             print(f"✅ Navigation successful.")
        else:
             print(f"❌ Navigation failed. Focused ID: {focused_id}")
             sys.exit(1)

        browser.close()

if __name__ == "__main__":
    verify_skip_link()
