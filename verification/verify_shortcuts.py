from playwright.sync_api import sync_playwright
import os
import sys

def verify_shortcuts():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Loading the local file directly using absolute path from /app
        page.goto(f"file://{os.getcwd()}/index.html")

        # Wait for the game to initialize and action buttons to appear
        # The game initializes on DOMContentLoaded, so it should be fast.
        try:
            page.wait_for_selector("#action-panel button", state="visible", timeout=5000)
        except Exception as e:
            print(f"ERROR: Action buttons did not appear: {e}")
            sys.exit(1)

        # 1. Verify visual hints
        print("Verifying visual hints...")
        buttons = page.query_selector_all("#action-panel button")
        if len(buttons) == 0:
            print("ERROR: No action buttons found.")
            sys.exit(1)

        # Check inner text of the first button.
        # Note: inner_text() might separate children with newlines or spaces.
        first_btn_text = buttons[0].inner_text()
        print(f"First button text: {first_btn_text}")

        if "[1]" not in first_btn_text:
            print(f"ERROR: Expected '[1]' in first button text, found: {first_btn_text}")
            sys.exit(1)
        else:
            print("PASS: First button has '[1]' hint.")

        # 2. Verify keyboard interaction
        print("Verifying keyboard shortcut '1'...")

        # Get initial log content
        initial_log = page.inner_text("#game-log-list")

        # Press '1'
        page.keyboard.press("1")

        # Wait for log to update
        try:
            # Pass initial_log as an argument to the function
            page.wait_for_function(
                "initial => document.getElementById('game-log-list').innerText !== initial",
                initial_log,
                timeout=2000
            )
        except Exception as e:
            # Check if it actually updated but we missed the timing or logic
            current_log = page.inner_text('#game-log-list')
            if current_log != initial_log:
                print("WARNING: wait_for_function timed out but log DOES appear different.")
            else:
                print("ERROR: Game log did not update after pressing '1'.")
                print(f"Log content: {current_log}")
                sys.exit(1)

        new_log = page.inner_text("#game-log-list")
        print(f"Log updated. New top line: {new_log.splitlines()[0]}")
        print("PASS: Game log updated after pressing '1'.")

        # Take a screenshot
        page.screenshot(path="verification/shortcuts_verified.png")
        print("Screenshot saved to verification/shortcuts_verified.png")

        browser.close()

if __name__ == "__main__":
    verify_shortcuts()
