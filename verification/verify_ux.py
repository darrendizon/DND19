from playwright.sync_api import sync_playwright
import os
import sys

def verify_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{os.getcwd()}/index.html")

        # Wait for buttons
        page.wait_for_selector("#action-panel button")

        # 1. Check aria-keyshortcuts
        print("Checking aria-keyshortcuts...")
        buttons = page.query_selector_all("#action-panel button")
        missing_aria = False
        for btn in buttons:
            ak = btn.get_attribute("aria-keyshortcuts")
            if not ak:
                print(f"FAIL: Button '{btn.inner_text().splitlines()[0]}' missing aria-keyshortcuts")
                missing_aria = True
            else:
                print(f"PASS: Button has aria-keyshortcuts='{ak}'")

        # 2. Check Spell Button Logic
        print("\nChecking Spell Button Logic...")

        # Force spell slots to 0
        print("Setting spell slots to 0...")
        page.evaluate("""() => {
            gameState.spellSlots = 0;
            generateOptions();
        }""")

        # Find spell button (3rd button usually, or find by text)
        spell_btn = page.query_selector("button[data-key='3']")
        if not spell_btn:
            print("ERROR: Spell button not found")
        else:
            desc = spell_btn.query_selector("span.text-gray-400").inner_text()
            aria_disabled = spell_btn.get_attribute("aria-disabled")

            print(f"Spell Button Description: '{desc}'")
            print(f"Spell Button aria-disabled: '{aria_disabled}'")

            if "No spell slots remaining" in desc and aria_disabled == "true":
                print("PASS: Spell button handles 0 slots correctly.")
            else:
                print("FAIL: Spell button does not indicate 0 slots correctly.")
                missing_aria = True # Treating as general failure flag

            # Take screenshot of the spell button state
            page.screenshot(path="verification/verify_ux.png")
            print("Screenshot saved to verification/verify_ux.png")

        browser.close()

        if missing_aria:
            sys.exit(1)

if __name__ == "__main__":
    verify_ux()
