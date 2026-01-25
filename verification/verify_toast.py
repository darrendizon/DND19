
from playwright.sync_api import sync_playwright
import os

def verify_toast():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{os.getcwd()}/index.html")

        # 1. Click 'Create Account'
        page.click("#btn-create-account")

        # 2. Wait for the toast
        try:
            toast = page.wait_for_selector('div[role="alert"]', state="visible", timeout=3000)
            text = toast.inner_text()
            print(f"Toast found with text: {text}")

            # Take screenshot
            page.screenshot(path="verification/toast_screenshot.png")
            print("Screenshot saved to verification/toast_screenshot.png")

            if "spirits of the void prevent" in text:
                print("SUCCESS: Toast text matches expected.")
            else:
                print("FAILURE: Toast text does not match.")
                exit(1)

        except Exception as e:
            print(f"FAILURE: Toast not found or timed out. {e}")
            exit(1)

        browser.close()

if __name__ == "__main__":
    verify_toast()
