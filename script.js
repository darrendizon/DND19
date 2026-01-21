/**
 * Dungeons & Dragons Accessible Adventure Engine
 *
 * Features:
 * - Semantic HTML & ARIA for Screen Readers
 * - Web Speech API for Text-to-Speech (TTS)
 * - Procedural "Infinite Horizon" World Generation
 * - High Contrast Dark Mode Theme
 */

// --- 1. GAME DATA & CONFIGURATION ---

const playerStats = {
    name: "Kaelen",
    maxHp: 42,
    currentHp: 42,
    ac: 18,
    spellSlots: 3,
    maxSpellSlots: 3
};

// "Infinite Horizon" Procedural Generation Modules
const WorldGenerator = {
    biomes: [
        "The Iron Tundra",
        "The Bioluminescent Veins",
        "The Clockwork Canopy",
        "The Sea of Glass",
        "The Floating Archipelago",
        "The Crimson Marsh"
    ],
    atmospheres: [
        "heavy with the static of a brewing magical storm, making your hair stand on end",
        "carrying a sharp scent of ozone and rotting jasmine",
        "unnatural, broken only by the rhythmic grinding of unseen machinery",
        "strange, where shadows don't follow the light but stretch toward you",
        "radiating a bone-deep chill, as if the world itself is mourning",
        "thin and ethereal, like a memory that is fading too fast"
    ],
    twists: [
        "a celestial eclipse that has lasted for a hundred years",
        "a curse that turns spoken words into physical pebbles",
        "gravity shifting every time a bell tolls in the distance",
        "a local deity dreaming the world into existence",
        "ancient sentinels that only move when you look away",
        "the literal unraveling of the horizon into a white void"
    ],

    /**
     * Generates a unique world setting object.
     * Incorporates a 'Sensory Layer' for accessibility (combining visuals/sounds into description).
     */
    generate() {
        const biome = this.biomes[Math.floor(Math.random() * this.biomes.length)];
        const atmosphere = this.atmospheres[Math.floor(Math.random() * this.atmospheres.length)];
        const twist = this.twists[Math.floor(Math.random() * this.twists.length)];

        // Cohesive string for TTS and Screen Readers
        const description = `You stand in ${biome}. The air is ${atmosphere}. You sense ${twist}.`;

        return { biome, atmosphere, twist, description };
    }
};

// --- 2. STATE MANAGEMENT ---

const GameState = {
    currentDescription: "",
    isMuted: true, // Default to muted for auto-play policy compliance
    history: []
};

// --- 3. DOM ELEMENTS ---

const ui = {
    storyContainer: document.getElementById('story-container'),
    liveRegion: document.getElementById('live-region'),
    hpDisplay: document.getElementById('hp-display'),
    hpBar: document.getElementById('hp-bar'),
    spellSlots: document.getElementById('spell-slots'),
    audioToggle: document.getElementById('audio-toggle'),
    bgMusic: document.getElementById('bg-music'),
    gameLog: document.getElementById('game-log-list'),

    // Actions
    btnAttack: document.getElementById('btn-attack'),
    btnInvestigate: document.getElementById('btn-investigate'),
    btnSpell: document.getElementById('btn-spell'),
    btnRepeat: document.getElementById('repeat-tts')
};

// --- 4. ACCESSIBILITY & AUDIO ENGINE ---

/**
 * TEXT-TO-SPEECH (TTS) HANDLER
 * Uses the native Web Speech API to read text aloud.
 * Cancels any current speech before starting new speech to prevent overlap.
 */
function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop previous
        const utterance = new SpeechSynthesisUtterance(text);

        // Optional: Adjust voice parameters
        utterance.rate = 1.0;
        utterance.pitch = 0.9; // Slightly deeper for fantasy vibe

        window.speechSynthesis.speak(utterance);
    }
}

/**
 * NARRATIVE UPDATE SYSTEM
 * Updates visual text, ARIA live region, and triggers TTS.
 * @param {string} text - The narrative text to display and speak.
 * @param {string} type - 'normal', 'crit', 'fail' (affects styling)
 */
function updateNarrative(text, type = 'normal') {
    GameState.currentDescription = text;

    // 1. Create visual element
    const p = document.createElement('p');
    p.textContent = text;

    if (type === 'crit') p.classList.add('crit-success');
    if (type === 'fail') p.classList.add('crit-fail');

    ui.storyContainer.appendChild(p);

    // Auto-scroll to bottom
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
        ui.storyContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        // Also scroll the parent container just in case
        document.getElementById('narrative-panel').scrollTop = document.getElementById('narrative-panel').scrollHeight;
    });

    // 2. Update ARIA Live Region (Screen Reader Announcement)
    // We clear it first to ensure the screen reader detects the change reliably
    ui.liveRegion.textContent = "";
    setTimeout(() => {
        ui.liveRegion.textContent = text;
    }, 50);

    // 3. Trigger TTS (Audio)
    speakText(text);

    // 4. Log to System Log
    addToLog(type.toUpperCase() + ": " + text.substring(0, 30) + "...");
}

function addToLog(msg) {
    const li = document.createElement('li');
    li.textContent = `> ${msg}`;
    ui.gameLog.insertBefore(li, ui.gameLog.firstChild);
}

// --- 5. GAME LOGIC ---

function initGame() {
    // Generate World
    const world = WorldGenerator.generate();

    // Delay slightly to allow UI to settle
    setTimeout(() => {
        updateNarrative(world.description);
    }, 500);

    // Update Stats UI
    updateStatsUI();
}

function updateStatsUI() {
    ui.hpDisplay.textContent = `${playerStats.currentHp} / ${playerStats.maxHp}`;
    const hpPercent = (playerStats.currentHp / playerStats.maxHp) * 100;
    ui.hpBar.style.width = `${hpPercent}%`;
    ui.spellSlots.textContent = `${playerStats.spellSlots}/${playerStats.maxSpellSlots}`;
}

function handleAttack() {
    const roll = Math.floor(Math.random() * 20) + 1; // d20
    let text = "";
    let type = "normal";

    if (roll === 20) {
        text = "CRITICAL HIT! Your blade sings with energy, severing the enemy's defenses in a spray of sparks!";
        type = "crit";
    } else if (roll === 1) {
        text = "FUMBLE! You trip over uneven terrain, your weapon clattering against the stone.";
        type = "fail";
        playerStats.currentHp = Math.max(0, playerStats.currentHp - 2);
    } else if (roll >= 10) {
        text = `You strike true (Roll: ${roll}). The enemy staggers back under your assault.`;
    } else {
        text = `You miss (Roll: ${roll}). Your attack glances harmlessly off the shadows.`;
    }

    updateNarrative(text, type);
    updateStatsUI();
}

function handleInvestigate() {
    const roll = Math.floor(Math.random() * 20) + 1;
    let text = "";
    let type = "normal";

    if (roll > 15) {
        text = "Your keen eyes spot a hidden cache of ancient gold hidden beneath a loose flagstone!";
        type = "crit";
    } else if (roll < 5) {
        text = "You peer into the darkness, but the shadows seem to bite back, clouding your vision.";
        type = "fail";
    } else {
        text = "You search the area but find nothing of immediate value, save for dust and echoes.";
    }

    updateNarrative(text, type);
}

function handleSpell() {
    if (playerStats.spellSlots <= 0) {
        updateNarrative("You are out of magical energy! You cannot cast spells.", "fail");
        return;
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    playerStats.spellSlots--;

    let text = "";
    let type = "normal";

    if (roll === 20) {
        text = "OVERCHARGE! Pure arcane energy erupts from your hands, vaporizing the darkness!";
        type = "crit";
    } else if (roll === 1) {
        text = "BACKFIRE! The spell fizzles and burns your hand.";
        type = "fail";
        playerStats.currentHp = Math.max(0, playerStats.currentHp - 4);
    } else {
        text = "You cast a bolt of force. It strikes the target with a resounding crack.";
    }

    updateNarrative(text, type);
    updateStatsUI();
}

// --- 6. EVENT LISTENERS ---

// Audio Toggle
ui.audioToggle.addEventListener('click', () => {
    if (ui.bgMusic.paused) {
        ui.bgMusic.play().then(() => {
            ui.audioToggle.textContent = "Mute Music 🔇";
            ui.audioToggle.setAttribute('aria-label', "Mute Background Music");
        }).catch(e => {
            console.log("Audio play failed (interaction required first):", e);
        });
    } else {
        ui.bgMusic.pause();
        ui.audioToggle.textContent = "Start Music 🎵";
        ui.audioToggle.setAttribute('aria-label', "Start Background Music");
    }
});

// Repeat TTS
ui.btnRepeat.addEventListener('click', () => {
    if (GameState.currentDescription) {
        speakText(GameState.currentDescription);
    }
});

// Actions
ui.btnAttack.addEventListener('click', handleAttack);
ui.btnInvestigate.addEventListener('click', handleInvestigate);
ui.btnSpell.addEventListener('click', handleSpell);

// Initialize on Load
window.addEventListener('DOMContentLoaded', initGame);
