/**
 * Dungeons & Dragons Accessible Adventure Engine (Full-Stack Client)
 *
 * Fully Client-Side Implementation with Local Logic.
 */

// --- STATE MANAGEMENT ---

const gameState = {
    hp: 42,
    maxHp: 42,
    spellSlots: 3,
    maxSpellSlots: 3,
    biome: 'tundra', // Default
    turn: 0
};

// --- DATA: BIOMES & NARRATIVES ---

const BIOMES = ['tundra', 'veins', 'clockwork', 'glass', 'archipelago', 'marsh'];

const NARRATIVES = {
    tundra: {
        intro: "You stand amidst the frozen wastes. The wind howls like a dying beast.",
        rooms: [
            "A frozen lake cracks beneath your feet, revealing dark depths below.",
            "Icicles hang like daggers from the cliffs, glinting in the pale light.",
            "Snow drifts pile high against ruined stone structures of a forgotten age.",
            "The air is so cold it burns your lungs. A shadow moves in the distance."
        ]
    },
    veins: {
        intro: "You descend into the deep earth, where bioluminescent veins pulse in the walls.",
        rooms: [
            "Glowing blue veins thump rhythmically in the rock, lighting your path.",
            "The tunnel narrows, and the air grows thick with the scent of ozone.",
            "Crystal formations chime softly as you pass, vibrating with energy.",
            "A cavern opens up, revealing a vast underground network of glowing roots."
        ]
    },
    clockwork: {
        intro: "You enter a realm of gears and steam. The ticking of a giant clock fills the air.",
        rooms: [
            "Giant brass gears turn slowly in the walls, grinding with the weight of time.",
            "Steam hisses from copper pipes, obscuring your vision.",
            "Mechanical spiders scuttle along the ceiling, watching you with glass eyes.",
            "The floor is a mesh of grating, looking down into an infinite machine."
        ]
    },
    glass: {
        intro: "You step onto a plain of shattered glass. The sky is a dull, featureless grey.",
        rooms: [
            "Shard-towers rise into the grey sky, reflecting nothing.",
            "The ground crunches beneath your boots. Every step is a risk.",
            "Mirrors float in the air, showing you reflections of things that aren't there.",
            "A storm of glass dust approaches, cutting the air."
        ]
    },
    archipelago: {
        intro: "Islands float in a void of purple nebula. Gravity is a suggestion here.",
        rooms: [
            "You leap from one floating rock to another, the void stretching infinitely below.",
            "Strange, winged creatures glide on the ether currents.",
            " ancient ruins float by, defying gravity.",
            "The stars feel close enough to touch in this place."
        ]
    },
    marsh: {
        intro: "A thick, green fog clings to the swamp. The ground squelches underfoot.",
        rooms: [
            "Twisted trees reach out with moss-covered branches.",
            "Bubbles rise from the murky water, popping with a noxious smell.",
            "Fireflies dance in the darkness, leading you astray.",
            "Something large moves in the water nearby."
        ]
    }
};

const ENCOUNTERS = [
    { name: "Shadow Wolf", hp: 10, damage: 4 },
    { name: "Crystal Golem", hp: 15, damage: 3 },
    { name: "Clockwork Soldier", hp: 12, damage: 5 },
    { name: "Void Wisp", hp: 8, damage: 6 }
];

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
    actionPanel: document.getElementById('action-panel').querySelector('div.grid'),
    btnRepeat: document.getElementById('repeat-tts'),
    btnAbout: document.getElementById('btn-about'),
    btnCreateAccount: document.getElementById('btn-create-account'),
    aboutModal: document.getElementById('about-modal'),
    btnCloseAbout: document.getElementById('btn-close-about'),
    aboutContent: document.getElementById('about-content')
};

// --- CORE GAME LOGIC ---

function startGame() {
    gameState.hp = gameState.maxHp;
    gameState.spellSlots = gameState.maxSpellSlots;
    gameState.biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    gameState.turn = 0;

    // Initial Render
    applyTheme(gameState.biome);
    updateStats();

    const narrative = NARRATIVES[gameState.biome].intro;
    updateNarrative(narrative);
    generateOptions();

    // Attempt to start music if allowed, otherwise waiting for user interaction
    // Browser autoplay policy might block this initially.
}

function handleAction(type) {
    gameState.turn++;
    let resultText = "";
    let logText = "";
    let hpChange = 0;

    // 1. Process Action
    if (type === 'attack') {
        const hit = Math.random() > 0.2; // 80% hit chance
        if (hit) {
            const dmg = Math.floor(Math.random() * 6) + 4;
            resultText = `You strike with your blade, dealing ${dmg} damage!`;
            logText = `Attack: Hit for ${dmg} dmg.`;
            playSound('attack');
        } else {
            resultText = "You swing your weapon, but the enemy dodges!";
            logText = "Attack: Miss.";
            playSound('miss');
        }
    } else if (type === 'investigate') {
        const found = Math.random() > 0.5;
        if (found) {
            resultText = "You find a hidden cache of supplies! You feel revitalized.";
            hpChange = 5;
            logText = "Investigate: Found supplies (+5 HP).";
            playSound('powerup');
        } else {
            resultText = "You search the area but find nothing of interest.";
            logText = "Investigate: Nothing found.";
        }
    } else if (type === 'spell') {
        if (gameState.spellSlots > 0) {
            gameState.spellSlots--;
            const dmg = Math.floor(Math.random() * 8) + 8;
            resultText = `You unleash a bolt of arcane energy! It crackles with power, dealing ${dmg} damage.`;
            logText = `Spell: Cast for ${dmg} dmg.`;
            playSound('spell');
        } else {
            resultText = "You are out of spell slots! The spell fizzles.";
            logText = "Spell: Fizzled (No slots).";
            playSound('fail');
        }
    } else if (type === 'travel') {
        // Change Biome
        const currentIdx = BIOMES.indexOf(gameState.biome);
        let nextIdx = (currentIdx + 1) % BIOMES.length;
        // Randomize slightly
        if (Math.random() > 0.5) nextIdx = Math.floor(Math.random() * BIOMES.length);

        gameState.biome = BIOMES[nextIdx];
        resultText = "You travel to a new region...";
        logText = `Travel: Moved to ${gameState.biome}.`;

        applyTheme(gameState.biome);
        changeMusic();
    }

    // 2. Enemy Retaliation (Random Event)
    if (Math.random() > 0.3) {
        const enemyDmg = Math.floor(Math.random() * 5) + 1;
        hpChange -= enemyDmg;
        resultText += ` A shadow strikes back, dealing ${enemyDmg} damage!`;
        logText += ` | Took ${enemyDmg} dmg.`;
        triggerHaptic(500); // Damage vibration
    }

    // 3. Update State
    gameState.hp += hpChange;
    if (gameState.hp > gameState.maxHp) gameState.hp = gameState.maxHp;
    if (gameState.hp <= 0) {
        gameState.hp = 0;
        resultText += " You have fallen in battle...";
        // Simple respawn logic for now
        setTimeout(() => {
            showToast("You have died. Resurrecting...");
            setTimeout(startGame, 3000);
        }, 2000);
    }
    updateStats();

    // 4. Update Narrative
    // Combine action result with a new random room description
    const roomDesc = NARRATIVES[gameState.biome].rooms[Math.floor(Math.random() * NARRATIVES[gameState.biome].rooms.length)];
    const fullText = `${resultText} ${roomDesc}`;

    let textType = 'normal';
    if (logText.includes('Hit') || logText.includes('Found')) textType = 'crit'; // Positive
    if (logText.includes('Miss') || logText.includes('Fizzled') || logText.includes('Took')) textType = 'fail'; // Negative/Mixed

    updateNarrative(fullText, textType, logText);
    generateOptions();
}

function generateOptions() {
    const options = [
        { label: "⚔️ Attack", description: "Strike with your Runeblade.", action_type: "attack" },
        { label: "🔍 Investigate", description: "Search for traps or loot.", action_type: "investigate" },
        {
            label: "✨ Cast Spell",
            description: gameState.spellSlots > 0 ? "Unleash arcane energy." : "No spell slots remaining.",
            action_type: "spell",
            disabled: gameState.spellSlots <= 0
        },
        { label: "🦶 Travel", description: "Move to a new area.", action_type: "travel" }
    ];
    renderButtons(options);
}

// --- RENDERING & UI HELPER FUNCTIONS ---

function renderButtons(options) {
    ui.actionPanel.innerHTML = "";
    options.forEach((opt, index) => {
        const key = index + 1;
        const btn = document.createElement('button');
        btn.className = "action-btn group relative w-full p-4 border border-gold/30 bg-charcoal hover:bg-charcoal-light transition-all rounded text-left focus:ring-2 focus:ring-gold mb-2";
        btn.dataset.key = key.toString();
        btn.setAttribute('aria-keyshortcuts', key.toString());

        if (opt.disabled) {
            btn.setAttribute('aria-disabled', 'true');
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // Remove Emoji for aria-label if desired, but here we keep them in visual text.
        // User asked: "Refrain from using Emoji's in the HTML" for the ABOUT POP-UP.
        // For buttons, emojis are often used as icons. I will keep them here unless requested otherwise for buttons.
        btn.innerHTML = `
            <span class="block text-lg font-bold text-gold group-hover:translate-x-1 transition-transform">
                <span class="inline-block text-xs border border-gold/30 rounded px-1.5 py-0.5 mr-2 text-gray-500 group-hover:text-gold transition-colors font-mono" aria-hidden="true">[${key}]</span>
                ${opt.label}
            </span>
            <span class="block text-sm text-gray-400 mt-1 pl-8">${opt.description}</span>
        `;
        btn.onclick = () => handleAction(opt.action_type);
        ui.actionPanel.appendChild(btn);
    });
}

function updateStats() {
    ui.hpDisplay.textContent = `${gameState.hp} / ${gameState.maxHp}`;
    const hpPercent = (gameState.hp / gameState.maxHp) * 100;
    ui.hpBar.style.width = `${hpPercent}%`;
    ui.hpBar.parentElement.setAttribute('aria-valuenow', gameState.hp);
    ui.hpBar.parentElement.setAttribute('aria-valuemax', gameState.maxHp);
    ui.spellSlots.textContent = `${gameState.spellSlots}/${gameState.maxSpellSlots}`;
}

function updateNarrative(text, type = 'normal', logUpdate = null) {
    const p = document.createElement('p');
    p.textContent = text;
    if (type === 'crit') p.classList.add('crit-success');
    if (type === 'fail') p.classList.add('crit-fail');

    ui.storyContainer.appendChild(p);

    requestAnimationFrame(() => {
        ui.storyContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        document.getElementById('narrative-panel').scrollTop = document.getElementById('narrative-panel').scrollHeight;
    });

    ui.liveRegion.textContent = "";
    setTimeout(() => {
        ui.liveRegion.textContent = text;
    }, 50);

    speakText(text);

    if (logUpdate) {
        const li = document.createElement('li');
        li.textContent = `> ${logUpdate}`;
        ui.gameLog.insertBefore(li, ui.gameLog.firstChild);
    }
}

function applyTheme(biome) {
    document.body.className = document.body.className.replace(/biome-\w+/g, "").trim();
    if (biome) {
        document.body.classList.add(`biome-${biome}`);
    }
}

function showToast(message) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-20 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'bg-charcoal border border-gold text-gold px-6 py-4 rounded shadow-2xl flex items-center gap-3 transform transition-all duration-300 translate-x-full opacity-0';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span class="text-xl">🔮</span>
        <p class="font-bold">${message}</p>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- AUDIO & HAPTICS (Step 4) ---

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function triggerHaptic(duration = 200) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Web Audio API Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'attack') {
        // Low thud/impact
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    } else if (type === 'miss') {
        // Whoosh
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.linearRampToValueAtTime(200, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    } else if (type === 'spell') {
        // Magic chime
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
    } else if (type === 'powerup') {
        // Powerup
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.linearRampToValueAtTime(600, now + 0.1);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
    } else if (type === 'fail') {
        // Error buzzer
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.linearRampToValueAtTime(150, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }
}

function changeMusic() {
    // Switch between a few placeholder tracks to simulate different themes
    // Using free reliable audio sources if available, or toggling between the same one to restart it
    // Since we only have one source in HTML, we can try to find another or just restart/modify playback rate
    // to simulate a different "feel" (e.g. slower for cave, faster for battle).

    const music = ui.bgMusic;
    const sources = [
        "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3", // Dark/Ambient
        "https://cdn.pixabay.com/audio/2021/09/06/audio_3439446c64.mp3", // Ethereal
        "https://cdn.pixabay.com/audio/2022/01/18/audio_d2166e5b85.mp3"  // Suspense
    ];

    // Simple deterministic hash of biome name to pick a track
    const biomeVal = gameState.biome.length;
    const trackIndex = biomeVal % sources.length;

    music.pause();
    const sourceEl = music.querySelector('source');
    if (sourceEl) {
        sourceEl.src = sources[trackIndex];
        music.load(); // Reload to apply new source
        // Only play if it was already playing or user opted in
        // (checking if it was playing is hard if we just paused it,
        // but we can check the toggle button state text)
        if (ui.audioToggle.textContent.includes("Mute")) {
            music.play().catch(e => console.log("Audio play failed:", e));
        }
    }
}

// --- INITIALIZATION ---

window.addEventListener('DOMContentLoaded', startGame);

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
    const lastP = ui.storyContainer.querySelector('p:last-child');
    if (lastP) speakText(lastP.textContent);
});

// --- UI & ACCESSIBILITY HANDLERS (Step 3) ---

ui.btnCreateAccount.addEventListener('click', () => {
    showToast("The spirits of the void prevent account creation at this time.");
});

ui.btnAbout.addEventListener('click', () => {
    ui.aboutModal.classList.remove('hidden');
    ui.aboutModal.setAttribute('aria-hidden', 'false');

    // Trap focus inside modal
    ui.btnCloseAbout.focus();

    // TTS Reading with Male Voice
    if ('speechSynthesis' in window) {
        // Construct the text content from the paragraphs
        const text = Array.from(ui.aboutContent.querySelectorAll('p'))
                          .map(p => p.textContent)
                          .join(" ");

        const utterance = new SpeechSynthesisUtterance(text);

        // Attempt to find a male voice
        const voices = window.speechSynthesis.getVoices();
        // This is a heuristic; 'Google US English' is often male or generic.
        // We look for "Male" or specific names, but often default is fine.
        // Let's try to set pitch lower to simulate male voice if explicit male voice isn't found.
        const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel'));
        if (maleVoice) utterance.voice = maleVoice;

        utterance.pitch = 0.8; // Lower pitch for male-sounding
        utterance.rate = 1.0;

        window.speechSynthesis.speak(utterance);
    }
});

ui.btnCloseAbout.addEventListener('click', () => {
    ui.aboutModal.classList.add('hidden');
    ui.aboutModal.setAttribute('aria-hidden', 'true');
    window.speechSynthesis.cancel(); // Stop reading
    ui.btnAbout.focus(); // Return focus
});

// Load voices when they are ready (Chrome needs this)
window.speechSynthesis.onvoiceschanged = () => {
    // Just to ensure getVoices() returns something later
};

// --- KEYBOARD SHORTCUTS ---

document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input field (e.g. if we add character name input later)
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    // Check for keys 1-9
    if (e.key >= '1' && e.key <= '9') {
        const btn = ui.actionPanel.querySelector(`button[data-key="${e.key}"]`);
        if (btn) {
            btn.click();
            btn.focus();
        }
    }
});
