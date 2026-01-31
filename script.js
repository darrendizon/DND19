/**
 * Dungeons & Dragons Accessible Adventure Engine (Full-Stack Client)
 *
 * Fully Client-Side Implementation with Local Logic.
 * Now Vibe Coded with AI-Simulated Randomization.
 */

// --- STATE MANAGEMENT ---

const gameState = {
    hp: 42,
    maxHp: 42,
    spellSlots: 3,
    maxSpellSlots: 3,
    biome: 'tundra', // Default
    chaosLevel: 0,   // New: Affects narrative intensity
    turn: 0
};

// --- DATA: BIOMES & GENERATOR ---

const BIOMES = ['tundra', 'veins', 'clockwork', 'glass', 'archipelago', 'marsh'];

class TextGenerator {
    constructor() {
        this.vocab = {
            general: {
                adjectives: ['ancient', 'crumbling', 'shadowy', 'silent', 'towering', 'ruined', 'echoing', 'misty'],
                nouns: ['monolith', 'void', 'archway', 'statue', 'altar', 'rift', 'structure', 'remnant'],
                verbs: ['looms', 'watches', 'fades', 'vibrates', 'crumbles', 'glows', 'pulses', 'waits'],
                connectors: ['in the distance', 'overhead', 'beneath your feet', 'surrounded by fog', 'bathed in darkness']
            },
            chaos: {
                adjectives: ['glitching', 'neon', 'distorted', 'shimmering', 'corrupted', 'holographic', 'fractured', 'screaming'],
                nouns: ['signal', 'static', 'geometry', 'code', 'data-stream', 'anomaly', 'polygon', 'noise'],
                verbs: ['flickers', 'glitches', 'rewrites', 'distorts', 'hums', 'bleeds', 'syncs', 'crashes']
            },
            biomes: {
                tundra: {
                    adjectives: ['frozen', 'bitter', 'crystalline', 'pale', 'howling', 'numb'],
                    nouns: ['glacier', 'icicle', 'blizzard', 'tundra', 'frost', 'snowdrift'],
                    verbs: ['cracks', 'bites', 'shivers', 'freezes', 'howls', 'glints']
                },
                veins: {
                    adjectives: ['bioluminescent', 'pulsing', 'deep', 'subterranean', 'rhythmic', 'thumping'],
                    nouns: ['vein', 'crystal', 'tunnel', 'cavern', 'root', 'heartbeat'],
                    verbs: ['throbs', 'pulses', 'glows', 'hums', 'illuminates', 'echoes']
                },
                clockwork: {
                    adjectives: ['brass', 'ticking', 'mechanical', 'steam-filled', 'rusted', 'precise'],
                    nouns: ['gear', 'piston', 'cog', 'steam', 'clock', 'automaton'],
                    verbs: ['ticks', 'grinds', 'hisses', 'turns', 'rotates', 'clicks']
                },
                glass: {
                    adjectives: ['shattered', 'reflective', 'sharp', 'mirror-like', 'fragile', 'translucent'],
                    nouns: ['shard', 'mirror', 'reflection', 'fragment', 'glass', 'prism'],
                    verbs: ['reflects', 'shines', 'cuts', 'glitters', 'breaks', 'distorts']
                },
                archipelago: {
                    adjectives: ['floating', 'ethereal', 'purple', 'weightless', 'star-filled', 'drifting'],
                    nouns: ['island', 'nebula', 'void', 'ruin', 'current', 'star'],
                    verbs: ['floats', 'drifts', 'soars', 'defies', 'shines', 'suspends']
                },
                marsh: {
                    adjectives: ['noxious', 'murky', 'twisted', 'green', 'bubbling', 'thick'],
                    nouns: ['swamp', 'fog', 'tree', 'bubble', 'firefly', 'mire'],
                    verbs: ['squelches', 'pops', 'clings', 'oozes', 'rises', 'decays']
                }
            }
        };

        this.templates = [
            "A {adj} {noun} {verb} {conn}.",
            "You see a {noun}, {adj} and {adj}, {verb}ing {conn}.",
            "{conn}, a {adj} {noun} {verb}.",
            "The air is {adj}. A {noun} {verb} nearby.",
            "You are near a {noun}. It {verb} with a {adj} energy."
        ];
    }

    _pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    _getWord(type, biome, chaosLevel) {
        // Chance to pick a chaos word increases with chaosLevel (0-100)
        const isChaos = Math.random() * 100 < chaosLevel;
        let pool = [];

        if (isChaos) {
            pool = this.vocab.chaos[type];
        } else {
            // Mix general and biome specific
            const biomeWords = this.vocab.biomes[biome] ? this.vocab.biomes[biome][type] : [];
            const generalWords = this.vocab.general[type];
            pool = [...biomeWords, ...generalWords, ...biomeWords]; // Weight biome words heavily
        }
        return this._pick(pool);
    }

    generate(biome, chaosLevel) {
        let template = this._pick(this.templates);

        // Replace placeholders
        return template.replace(/{(\w+)}/g, (match, p1) => {
            if (p1 === 'conn') return this._pick(this.vocab.general.connectors);
            return this._getWord(p1 + 's', biome, chaosLevel); // p1 is adj, noun, verb -> pluralize for key
        });
    }

    generateIntro(biome) {
        const intros = {
            tundra: "You stand amidst the frozen wastes. The wind howls like a dying beast.",
            veins: "You descend into the deep earth, where bioluminescent veins pulse in the walls.",
            clockwork: "You enter a realm of gears and steam. The ticking of a giant clock fills the air.",
            glass: "You step onto a plain of shattered glass. The sky is a dull, featureless grey.",
            archipelago: "Islands float in a void of purple nebula. Gravity is a suggestion here.",
            marsh: "A thick, green fog clings to the swamp. The ground squelches underfoot."
        };
        return intros[biome] || "You find yourself in an unknown land.";
    }
}

const generator = new TextGenerator();

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
    aboutContent: document.getElementById('about-content'),
    // Help Elements
    btnHelp: document.getElementById('btn-help'),
    helpModal: document.getElementById('help-modal'),
    btnCloseHelp: document.getElementById('btn-close-help'),
    // Settings Elements
    btnSettings: document.getElementById('btn-settings'),
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    settingContrast: document.getElementById('setting-contrast'),
    settingTextColor: document.getElementById('setting-text-color'),
    settingFont: document.getElementById('setting-font'),
    settingTextSize: document.getElementById('setting-text-size'),
    settingLineHeight: document.getElementById('setting-line-height'),
    settingReducedMotion: document.getElementById('setting-reduced-motion'),
    settingTtsSpeed: document.getElementById('setting-tts-speed')
};

// --- CORE GAME LOGIC ---

function startGame() {
    // Load Settings
    loadSettings();

    gameState.hp = gameState.maxHp;
    gameState.spellSlots = gameState.maxSpellSlots;
    gameState.biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    gameState.chaosLevel = 0;
    gameState.turn = 0;

    // Initial Render
    applyTheme(gameState.biome);
    updateStats();

    const narrative = generator.generateIntro(gameState.biome);
    updateNarrative(narrative);
    generateOptions();
}

function handleAction(type) {
    gameState.turn++;
    let resultText = "";
    let logText = "";
    let hpChange = 0;

    // Increase chaos slightly every turn
    gameState.chaosLevel = Math.min(100, gameState.chaosLevel + 2);

    // 1. Process Action
    if (type === 'attack') {
        const hit = Math.random() > 0.2; // 80% hit chance
        if (hit) {
            const dmg = Math.floor(Math.random() * 6) + 4;
            resultText = `You strike with your blade, dealing ${dmg} damage!`;
            logText = `Attack: Hit for ${dmg} dmg.`;
            playSound('attack');
            // Reducing chaos on successful combat
            gameState.chaosLevel = Math.max(0, gameState.chaosLevel - 5);
        } else {
            resultText = "You swing your weapon, but the enemy dodges!";
            logText = "Attack: Miss.";
            playSound('miss');
            gameState.chaosLevel += 5; // Frustration increases chaos
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
            gameState.chaosLevel += 10; // Magic is chaotic
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

        // Travel resets chaos a bit
        gameState.chaosLevel = Math.max(0, gameState.chaosLevel - 20);

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
    // Combine action result with a new AI-generated room description
    const roomDesc = generator.generate(gameState.biome, gameState.chaosLevel);
    const fullText = `${resultText} ${roomDesc}`;

    let textType = 'normal';
    if (logText.includes('Hit') || logText.includes('Found')) textType = 'crit'; // Positive
    if (logText.includes('Miss') || logText.includes('Fizzled') || logText.includes('Took')) textType = 'fail'; // Negative/Mixed

    // Apply glitch effect if chaos is high
    if (gameState.chaosLevel > 50 && Math.random() > 0.7) {
        textType = 'glitch';
    }

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
    if (type === 'glitch') p.classList.add('text-glitch'); // New Vibe style

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
    // Retain high contrast mode if active
    const isHighContrast = document.body.classList.contains('high-contrast');

    document.body.className = document.body.className.replace(/biome-\w+/g, "").trim();
    if (biome) {
        document.body.classList.add(`biome-${biome}`);
    }

    if (isHighContrast) document.body.classList.add('high-contrast');
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

// --- SETTINGS MANAGEMENT ---

function loadSettings() {
    const contrast = localStorage.getItem('setting-contrast') || 'normal';
    const textColor = localStorage.getItem('setting-text-color') || 'default';
    const font = localStorage.getItem('setting-font') || 'serif';
    const textSize = localStorage.getItem('setting-text-size') || '18px';
    const lineHeight = localStorage.getItem('setting-line-height') || '1.6';
    const reducedMotion = localStorage.getItem('setting-reduced-motion') === 'true';
    const ttsSpeed = localStorage.getItem('setting-tts-speed') || '1.0';

    // Update UI controls
    if (ui.settingContrast) ui.settingContrast.value = contrast;
    if (ui.settingTextColor) ui.settingTextColor.value = textColor;
    if (ui.settingFont) ui.settingFont.value = font;
    if (ui.settingTextSize) ui.settingTextSize.value = textSize;
    if (ui.settingLineHeight) ui.settingLineHeight.value = lineHeight;
    if (ui.settingReducedMotion) ui.settingReducedMotion.checked = reducedMotion;
    if (ui.settingTtsSpeed) ui.settingTtsSpeed.value = ttsSpeed;

    applySettings(contrast, textColor, font, textSize, lineHeight, reducedMotion);
}

function applySettings(contrast, textColor, font, textSize, lineHeight, reducedMotion) {
    const root = document.documentElement;

    // 1. Contrast
    if (contrast === 'high') {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }

    // 2. Text Color
    const colorMap = {
        'default': '#e3dcd2',
        'white': '#ffffff',
        'yellow': '#facc15', // Yellow-400
        'green': '#4ade80',  // Green-400
        'cyan': '#22d3ee'    // Cyan-400
    };
    if (colorMap[textColor]) {
        root.style.setProperty('--color-text-base', colorMap[textColor]);
    }

    // 3. Font
    const fontMap = {
        'serif': "'Merriweather', 'Georgia', serif",
        'sans': "'ui-sans-serif', 'system-ui', 'sans-serif'",
        'atkinson': "'Atkinson Hyperlegible', sans-serif",
        'mono': "'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace",
        'dyslexic': "'OpenDyslexic', 'Comic Sans MS', 'Verdana', sans-serif"
    };
    if (fontMap[font]) {
        root.style.setProperty('--font-main', fontMap[font]);
    }

    // 4. Text Size & Line Height
    root.style.setProperty('--font-size', textSize);
    root.style.setProperty('--line-height', lineHeight);

    // 5. Reduced Motion
    if (reducedMotion) {
        document.body.classList.add('reduce-motion');
    } else {
        document.body.classList.remove('reduce-motion');
    }
}

// --- AUDIO & HAPTICS ---

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Use stored TTS rate or default to 1.0
        const rate = parseFloat(localStorage.getItem('setting-tts-speed')) || 1.0;
        utterance.rate = rate;
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
    const music = ui.bgMusic;
    const sources = [
        "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3", // Dark/Ambient
        "https://cdn.pixabay.com/audio/2021/09/06/audio_3439446c64.mp3", // Ethereal
        "https://cdn.pixabay.com/audio/2022/01/18/audio_d2166e5b85.mp3"  // Suspense
    ];

    const biomeVal = gameState.biome.length;
    const trackIndex = biomeVal % sources.length;

    music.pause();
    const sourceEl = music.querySelector('source');
    if (sourceEl) {
        sourceEl.src = sources[trackIndex];
        music.load();
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
    ui.btnCloseAbout.focus();

    if ('speechSynthesis' in window) {
        const text = Array.from(ui.aboutContent.querySelectorAll('p'))
                          .map(p => p.textContent)
                          .join(" ");

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel'));
        if (maleVoice) utterance.voice = maleVoice;

        utterance.pitch = 0.8;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
});

ui.btnCloseAbout.addEventListener('click', () => {
    ui.aboutModal.classList.add('hidden');
    ui.aboutModal.setAttribute('aria-hidden', 'true');
    window.speechSynthesis.cancel();
    ui.btnAbout.focus();
});

// Help Handlers
ui.btnHelp.addEventListener('click', () => {
    ui.helpModal.classList.remove('hidden');
    ui.helpModal.setAttribute('aria-hidden', 'false');
    ui.btnCloseHelp.focus();
});

ui.btnCloseHelp.addEventListener('click', () => {
    ui.helpModal.classList.add('hidden');
    ui.helpModal.setAttribute('aria-hidden', 'true');
    ui.btnHelp.focus();
});

// Settings Handlers
ui.btnSettings.addEventListener('click', () => {
    ui.settingsModal.classList.remove('hidden');
    ui.settingsModal.setAttribute('aria-hidden', 'false');
    ui.btnCloseSettings.focus();
});

ui.btnCloseSettings.addEventListener('click', () => {
    ui.settingsModal.classList.add('hidden');
    ui.settingsModal.setAttribute('aria-hidden', 'true');
    ui.btnSettings.focus();
});

// Settings Change Listeners
const updateSettings = () => {
    const contrast = ui.settingContrast.value;
    const textColor = ui.settingTextColor.value;
    const font = ui.settingFont.value;
    const textSize = ui.settingTextSize.value;
    const lineHeight = ui.settingLineHeight.value;
    const reducedMotion = ui.settingReducedMotion.checked;
    const ttsSpeed = ui.settingTtsSpeed.value;

    localStorage.setItem('setting-contrast', contrast);
    localStorage.setItem('setting-text-color', textColor);
    localStorage.setItem('setting-font', font);
    localStorage.setItem('setting-text-size', textSize);
    localStorage.setItem('setting-line-height', lineHeight);
    localStorage.setItem('setting-reduced-motion', reducedMotion);
    localStorage.setItem('setting-tts-speed', ttsSpeed);

    applySettings(contrast, textColor, font, textSize, lineHeight, reducedMotion);
};

ui.settingContrast.addEventListener('change', updateSettings);
ui.settingTextColor.addEventListener('change', updateSettings);
ui.settingFont.addEventListener('change', updateSettings);
ui.settingTextSize.addEventListener('change', updateSettings);
ui.settingLineHeight.addEventListener('change', updateSettings);
ui.settingReducedMotion.addEventListener('change', updateSettings);
ui.settingTtsSpeed.addEventListener('input', updateSettings);


// Load voices when they are ready (Chrome needs this)
window.speechSynthesis.onvoiceschanged = () => {
    // Just to ensure getVoices() returns something later
};

// --- KEYBOARD SHORTCUTS & FOCUS MANAGEMENT ---

function trapFocus(e, modal) {
    if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    } else if (e.key === 'Escape') {
        // Close current modal
        if (!ui.aboutModal.classList.contains('hidden')) ui.btnCloseAbout.click();
        if (!ui.helpModal.classList.contains('hidden')) ui.btnCloseHelp.click();
        if (!ui.settingsModal.classList.contains('hidden')) ui.btnCloseSettings.click();
    }
}

document.addEventListener('keydown', (e) => {
    // Modal Trap
    if (!ui.aboutModal.classList.contains('hidden')) return trapFocus(e, ui.aboutModal);
    if (!ui.helpModal.classList.contains('hidden')) return trapFocus(e, ui.helpModal);
    if (!ui.settingsModal.classList.contains('hidden')) return trapFocus(e, ui.settingsModal);

    // Global Shortcuts (ignore if typing in inputs)
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.key >= '1' && e.key <= '9') {
        const btn = ui.actionPanel.querySelector(`button[data-key="${e.key}"]`);
        if (btn) {
            btn.click();
            btn.focus();
        }
    }
});
