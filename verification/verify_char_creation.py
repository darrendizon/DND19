from playwright.sync_api import sync_playwright
import os

def verify_character_creation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Loading the local file directly using absolute path from /app
        page.goto(f"file://{os.getcwd()}/index.html")

        # Verify Modal Exists and is Visible
        print("Checking for Character Creation Modal...")
        page.wait_for_selector("text=Create Your Character")

        # Verify Randomize Button Works
        print("Testing Randomize Button...")
        input_field = page.locator("#char-name-input")
        initial_value = input_field.input_value()
        print(f"Initial Value: {initial_value}")

        page.click("#btn-random-char")
        page.wait_for_timeout(100) # Wait for JS to update
        new_value = input_field.input_value()
        print(f"New Value: {new_value}")

        if initial_value == new_value:
             # It's possible random chose the same name, try one more time
             page.click("#btn-random-char")
             page.wait_for_timeout(100)
             new_value = input_field.input_value()

        if initial_value == new_value:
             print("Warning: Randomize button didn't change the name (or very unlucky).")
        else:
             print("Randomize button works.")

        # Take screenshot of Modal
        page.screenshot(path="verification/char_creation_modal.png")
        print("Screenshot of modal saved.")

        # Start Game
        print("Starting Game...")
        page.click("#btn-start-game")

        # Verify Modal Hidden
        # We check if it has the 'hidden' class or is not visible
        page.wait_for_selector("#char-modal.hidden", state="attached")
        print("Modal hidden.")

        # Verify Name Updated in UI
        print("Verifying Name Update...")
        name_display = page.locator("#character-name")
        displayed_name = name_display.text_content()
        print(f"Displayed Name: {displayed_name}")

        if displayed_name == new_value:
             print("Name successfully updated in UI.")
        else:
             print(f"Error: Name mismatch. Expected {new_value}, got {displayed_name}")

        # Take screenshot of Game
        page.screenshot(path="verification/game_started.png")
        print("Screenshot of game saved.")

        browser.close()

if __name__ == "__main__":
    verify_character_creation()
