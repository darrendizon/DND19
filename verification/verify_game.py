
from playwright.sync_api import sync_playwright
import os

def verify_game_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Loading the local file directly using absolute path from /app
        page.goto(f"file://{os.getcwd()}/index.html")

        # Verify title
        if "The Obsidian Vault" not in page.title():
            print(f"Title mismatch: {page.title()}")

        # Verify specific elements exist
        page.wait_for_selector("text=The Infinite Horizon")
        page.wait_for_selector("text=Character Stats")
        page.wait_for_selector("text=Actions")

        # Take a screenshot
        page.screenshot(path="verification/game_load.png")
        print("Screenshot saved to verification/game_load.png")

        browser.close()

if __name__ == "__main__":
    verify_game_load()
