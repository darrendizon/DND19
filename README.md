# The Infinite Horizon

A high-fantasy, accessible text-based adventure game.

## Overview

"The Infinite Horizon" is a fully client-side web application designed to be accessible to the blind and visually impaired. It features procedural world generation, combat, and exploration, all running locally in your browser.

Originally started in 2019 as a Python project, it has been completely rewritten in HTML, CSS, and Vanilla JavaScript to run without any backend dependencies.

## Features

- **Accessibility First:** Semantic HTML, ARIA live regions for dynamic content, and full keyboard navigation.
- **Client-Side Logic:** All game state, narratives, and logic are handled locally in `script.js`.
- **Dynamic Themes:** Visual themes (biomes) change dynamically as you explore.
- **Audio & Haptics:** Immersive soundscapes and vibration feedback (on supported devices).

## How to Play

### Online (GitHub Pages)
The game is automatically deployed to GitHub Pages. You can play it directly in your browser without installing anything.
[Link to Game](https://<username>.github.io/<repo-name>)

### Local Development
To run the game locally:
1. Clone the repository.
2. Open `index.html` in your web browser.
   - Note: Some browsers may restrict audio autoplay or certain features when running directly from the file system.
   - For the best experience, use a local development server (e.g., `npx serve` or `python3 -m http.server`).

## Controls
- **Tab / Shift+Tab:** Navigate through interactive elements.
- **Space / Enter:** Activate buttons.
- **Screen Reader:** The game is optimized for use with NVDA, JAWS, and VoiceOver.

## Credits
Copyright 2019-2026 by Darren Dizon under the direction of the California School for the Blind.
