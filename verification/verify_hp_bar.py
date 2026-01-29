
from playwright.sync_api import sync_playwright
import os
import time

def verify_hp_bar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{os.getcwd()}/index.html")

        # Locate the HP bar container
        # In the plan, I will add role="progressbar" to the div wrapping the bar.
        # Currently it might not have it, so this test might fail initially.
        # But I can look for it by selector and check attributes.

        # The structure is:
        # <div class="space-y-4" role="group" aria-label="Vitals">
        #   <div> ...
        #     <div class="w-full bg-gray-700 h-4 rounded-full border border-gray-600">
        #       <div id="hp-bar" ...></div>

        # I expect the progressbar role to be on the parent of #hp-bar
        hp_bar_container = page.locator("#hp-bar").locator("..")

        # Check if role is present (it won't be initially, so this confirms the need for change)
        role = hp_bar_container.get_attribute("role")
        print(f"Current role: {role}")

        if role != "progressbar":
            print("FAIL: HP bar does not have role='progressbar'")
        else:
            print("PASS: HP bar has role='progressbar'")

        # Check ARIA attributes
        valuenow = hp_bar_container.get_attribute("aria-valuenow")
        valuemin = hp_bar_container.get_attribute("aria-valuemin")
        valuemax = hp_bar_container.get_attribute("aria-valuemax")

        print(f"aria-valuenow: {valuenow}")
        print(f"aria-valuemin: {valuemin}")
        print(f"aria-valuemax: {valuemax}")

        if valuenow == "42" and valuemin == "0" and valuemax == "42":
             print("PASS: Initial ARIA attributes are correct")
        else:
             print("FAIL: Initial ARIA attributes are incorrect or missing")

        # Now simulate taking damage or healing to see if it updates
        # Since combat is random, we can just check if updateStats function works by injecting JS
        # Or we can just inspect the code change.
        # But let's try to manipulate state via console to be deterministic.

        page.evaluate("gameState.hp = 20; updateStats();")

        # Check attributes again
        new_valuenow = hp_bar_container.get_attribute("aria-valuenow")
        print(f"Updated aria-valuenow: {new_valuenow}")

        if new_valuenow == "20":
            print("PASS: ARIA attributes updated correctly")
        else:
             print("FAIL: ARIA attributes did not update")

        browser.close()

if __name__ == "__main__":
    verify_hp_bar()
