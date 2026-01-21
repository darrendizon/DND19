/**
 * Dungeons & Dragons Accessible Adventure Engine (Full-Stack Client)
 *
 * Connected to Python/FastAPI Backend for Infinite Procedural Generation.
 */

// --- STATE MANAGEMENT ---

let currentPlayerId = null;
let currentGameState = null;

// --- DOM ELEMENTS ---

const ui = {
    storyContainer: document.getElementById('story-container'),
    liveRegion: document.getElementById('live-region'),
    hpDisplay: document.getElementById('hp-display'),
    hpBar: document.getElementById('hp-bar'),
    spellSlots: document.getElementById('spell-slots'),
    audioToggle: document.getElementById('audio-toggle'),
    bgMusic: document.getElementById('bg-music'),
    gameLog: document.getElementById('game-log-list'),

    // Actions Container
    actionPanel: document.getElementById('action-panel').querySelector('div.grid'),
    btnRepeat: document.getElementById('repeat-tts')
};

const API_BASE = "http://localhost:8000";

// --- ACCESSIBILITY & AUDIO ENGINE ---

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

/**
 * HAPTIC FEEDBACK (Mod 13)
 * Triggers vibration on mobile devices if supported.
 */
function triggerHaptic(duration = 200) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

/**
 * THE ECHO (Mod 11)
 * Replays a ghostly version of the action sound or log after 3 seconds.
 */
function triggerEcho(text) {
    setTimeout(() => {
        // We use TTS as the "Ghostly Sound" for accessibility
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Echo... ${text}`);
            utterance.rate = 0.7; // Slower
            utterance.pitch = 0.5; // Lower, ghostly
            utterance.volume = 0.5; // Quieter
            window.speechSynthesis.speak(utterance);
        }
    }, 3000);
}

// --- RENDER ENGINE ---

function applyTheme(biome) {
    // Remove all biome classes
    document.body.className = document.body.className.replace(/biome-\w+/g, "").trim();
    // Add new biome class
    if (biome) {
        document.body.classList.add(`biome-${biome}`);
    }
}

function updateNarrative(text, type = 'normal', logUpdate = null) {
    // 1. Visual Update
    const p = document.createElement('p');
    p.textContent = text;
    if (type === 'crit') p.classList.add('crit-success');
    if (type === 'fail') p.classList.add('crit-fail');
    ui.storyContainer.appendChild(p);

    requestAnimationFrame(() => {
        ui.storyContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        // Also scroll the parent container just in case
        document.getElementById('narrative-panel').scrollTop = document.getElementById('narrative-panel').scrollHeight;
    });

    // 2. ARIA Update
    ui.liveRegion.textContent = "";
    setTimeout(() => {
        ui.liveRegion.textContent = text;
    }, 50);

    // 3. TTS
    speakText(text);

    // 4. Log
    if (logUpdate) {
        const li = document.createElement('li');
        li.textContent = `> ${logUpdate}`;
        ui.gameLog.insertBefore(li, ui.gameLog.firstChild);

        // Trigger Echo for the action log
        triggerEcho(logUpdate);
    }
}

function renderButtons(options) {
    ui.actionPanel.innerHTML = ""; // Clear existing

    options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = "action-btn group relative w-full p-4 border border-gold/30 bg-charcoal hover:bg-charcoal-light transition-all rounded text-left focus:ring-2 focus:ring-gold mb-2";

        // Keyboard shortcut hint (1-9)
        const shortcutHint = index < 9 ? ` <kbd class="text-sm font-normal text-gray-500 ml-2 border border-gray-600 rounded px-1 hidden md:inline-block">[${index + 1}]</kbd>` : '';

        btn.innerHTML = `
            <span class="block text-lg font-bold text-gold group-hover:translate-x-1 transition-transform">
                ${opt.label}${shortcutHint}
            </span>
            <span class="block text-sm text-gray-400 mt-1">${opt.description}</span>
        `;

        btn.onclick = () => handleAction(opt.action_type);

        ui.actionPanel.appendChild(btn);
    });
}

function updateStats(state) {
    document.getElementById('hp-display').textContent = `${state.current_hp} / ${state.max_hp}`;
    const hpPercent = (state.current_hp / state.max_hp) * 100;
    ui.hpBar.style.width = `${hpPercent}%`;
    ui.spellSlots.textContent = `${state.spell_slots}/${state.max_spell_slots}`;
}

// --- API CLIENT ---

async function startGame() {
    try {
        ui.storyContainer.innerHTML = "<p class='italic text-gray-500'>Connecting to World Engine...</p>";

        const response = await fetch(`${API_BASE}/start`, { method: "POST" });
        const data = await response.json();

        handleResponse(data);
        currentPlayerId = data.player_state.player_id;

    } catch (err) {
        console.error("Failed to start game:", err);
        ui.storyContainer.innerHTML += "<p class='text-red-500'>Connection failed. Please ensure the Python server is running.</p>";
    }
}

async function handleAction(type) {
    if (!currentPlayerId) return;

    try {
        const response = await fetch(`${API_BASE}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ player_id: currentPlayerId, action_type: type })
        });
        const data = await response.json();
        handleResponse(data);

    } catch (err) {
        console.error("Action failed:", err);
    }
}

function handleResponse(data) {
    // 1. Theme
    applyTheme(data.biome);

    // 2. Stats
    updateStats(data.player_state);

    // 3. Narrative
    // If there is a log update (action result), show that first?
    // Usually we append the narrative description.
    let textType = 'normal';
    if (data.log_update) {
        if (data.log_update.includes("CRITICAL")) textType = 'crit';
        if (data.log_update.includes("MISS") || data.log_update.includes("failed")) textType = 'fail';
        updateNarrative(data.log_update, textType, data.log_update);
    }

    // Then show the room description
    // Avoid repeating if it's the exact same? The backend handles "still in battle" logic.
    setTimeout(() => {
        updateNarrative(data.description);
    }, 1000); // Slight delay for pacing

    // 4. Buttons
    renderButtons(data.options);

    // 5. Haptics
    if (data.hp_change < 0) {
        triggerHaptic(500); // Long vibration for damage
    } else if (data.hp_change > 0) {
        triggerHaptic(100); // Short pulse for healing
    }
}

// --- INIT ---

ui.audioToggle.addEventListener('click', () => {
    if (ui.bgMusic.paused) {
        ui.bgMusic.play().then(() => {
            ui.audioToggle.textContent = "Mute Music 🔇";
            ui.audioToggle.setAttribute('aria-label', "Mute Background Music");
        });
    } else {
        ui.bgMusic.pause();
        ui.audioToggle.textContent = "Start Music 🎵";
        ui.audioToggle.setAttribute('aria-label', "Start Background Music");
    }
});

ui.btnRepeat.addEventListener('click', () => {
    // Speaks the last added paragraph
    const lastP = ui.storyContainer.querySelector('p:last-child');
    if (lastP) speakText(lastP.textContent);
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore if holding modifiers (except Shift, maybe) to avoid browser conflict
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Check for number keys 1-9
    const key = parseInt(e.key);
    if (!isNaN(key) && key > 0 && key <= 9) {
        const buttons = ui.actionPanel.querySelectorAll('button');
        const targetBtn = buttons[key - 1];

        if (targetBtn) {
            e.preventDefault(); // Prevent scrolling if that's a thing
            targetBtn.focus(); // Good a11y: move focus to what we just activated
            targetBtn.click();
            triggerHaptic(50); // Feedback
        }
    }
});

window.addEventListener('DOMContentLoaded', startGame);
