/**
 * Dungeons & Dragons Accessible Adventure Engine (Full-Stack Client)
 *
 * Fully local logic replacing Python backend.
 */

// --- DATA & CONFIG ---

const BIOMES = [
    { name: "The Iron Tundra", id: "tundra", color: "blue", theme: "theme-tundra" },
    { name: "The Bioluminescent Veins", id: "veins", color: "neon", theme: "theme-veins" },
    { name: "The Clockwork Canopy", id: "clockwork", color: "orange", theme: "theme-clockwork" },
    { name: "The Sea of Glass", id: "glass", color: "white", theme: "theme-glass" },
    { name: "The Floating Archipelago", id: "archipelago", color: "violet", theme: "theme-archipelago" },
    { name: "The Crimson Marsh", id: "marsh", color: "red", theme: "theme-marsh" },
];

const ATMOSPHERES = [
    "heavy with static", "smelling of ozone", "unnaturally silent",
    "shifting with shadows", "bone-chillingly cold", "thin and ethereal"
];

const ENEMIES = {
    "tundra": ["Frost Giant Sentinel", "Shard Wolf"],
    "veins": ["Deep-Dwelling Gloom", "Spore Berzerker"],
    "clockwork": ["Brass Automaton", "Gear-Grinder Golem"],
    "glass": ["Mirror Wraith", "Sun-Scorched Stalker"],
    "archipelago": ["Wind Drake", "Void Ray"],
    "marsh": ["Blood-Lily Siren", "Rotting Hulk"]
};

// Dialects for flavor text
const DIALECTS = {
    "archaic": (text) => `Hark! ${text} Verily, danger abounds.`,
    "slang": (text) => `Yo, listen up. ${text} Watch your back.`,
    "formal": (text) => `Attention. ${text} Proceed with caution.`,
    "mystic": (text) => `The spirits whisper... ${text} Fate is watching.`
};

const RANDOM_NAMES = [
    "Kaelen", "Thorne", "Lyra", "Vael", "Draken", "Sylas",
    "Mara", "Orion", "Nyx", "Caelum", "Elowen", "Riven"
];

const TITLES = [
    "the Void-Walker", "the Light-Bringer", "of the Iron Will",
    "the Shadow-Weaver", "the Storm-Caller", "the Night-Blade"
];

// --- STATE MANAGEMENT ---

const state = {
    player: {
        name: "Unknown Hero",
        hp: 42,
        maxHp: 42,
        ac: 18,
        spellSlots: 3,
        maxSpellSlots: 3,
        wins: 0,
        seed: Date.now()
    },
    game: {
        currentRoomId: 1,
        inBattle: true, // Start in battle
        currentEnemy: null,
        currentBiome: null,
        currentAtmosphere: null,
        isMusicPlaying: false
    }
};

// --- DOM ELEMENTS ---

const ui = {
    startScreen: document.getElementById('start-screen'),
    charNameInput: document.getElementById('char-name'),
    btnRandomName: document.getElementById('btn-random-name'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnMultiplayer: document.getElementById('btn-multiplayer'),

    displayCharName: document.getElementById('display-char-name'),

    storyContainer: document.getElementById('story-container'),
    liveRegion: document.getElementById('live-region'),
    hpDisplay: document.getElementById('hp-display'),
    hpBar: document.getElementById('hp-bar'),
    spellSlots: document.getElementById('spell-slots'),
    audioToggle: document.getElementById('audio-toggle'),
    gameLog: document.getElementById('game-log-list'),
    actionPanel: document.getElementById('actions-grid'),
    btnRepeat: document.getElementById('repeat-tts'),

    // Audio
    bgMusicMain: document.getElementById('bg-music-main'),
    bgMusicBattle: document.getElementById('bg-music-battle'),
    sfxWin: document.getElementById('sfx-win'),
    sfxHit: document.getElementById('sfx-hit')
};

// --- AUDIO & HAPTICS ---

function playMusic(type) {
    if (!state.game.isMusicPlaying) return;

    ui.bgMusicMain.pause();
    ui.bgMusicBattle.pause();

    let track;
    if (type === 'battle') {
        track = ui.bgMusicBattle;
    } else {
        track = ui.bgMusicMain;
    }

    // Simple logic: Change playback rate based on wins (progress)
    const rate = 1.0 + (state.player.wins * 0.05);
    track.playbackRate = Math.min(rate, 1.5); // Cap at 1.5x speed

    track.play().catch(e => console.log("Audio play failed:", e));
}

function stopMusic() {
    ui.bgMusicMain.pause();
    ui.bgMusicBattle.pause();
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

function triggerHaptic(duration = 200) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

function triggerEcho(text) {
    setTimeout(() => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Echo... ${text}`);
            utterance.rate = 0.7;
            utterance.pitch = 0.5;
            utterance.volume = 0.5;
            window.speechSynthesis.speak(utterance);
        }
    }, 3000);
}

// --- GAME LOGIC ---

function calculateDifficulty() {
    return 1.0 + (state.player.wins / 5) * 0.1;
}

function generateRandomName() {
    const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const title = TITLES[Math.floor(Math.random() * TITLES.length)];
    return `${name} ${title}`;
}

function generateRoomContent(seed) {
    // Pseudo-random based on seed (simple implementation)
    // In JS we can just use Math.random() since we don't strictly need deterministic replay for this local version,
    // but to simulate the Python seed logic we can just use random choices.

    const biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    const atmosphere = ATMOSPHERES[Math.floor(Math.random() * ATMOSPHERES.length)];
    const enemy = ENEMIES[biome.id][Math.floor(Math.random() * ENEMIES[biome.id].length)];

    const dialectKeys = Object.keys(DIALECTS);
    const dialectName = dialectKeys[Math.floor(Math.random() * dialectKeys.length)];
    const flavorFunc = DIALECTS[dialectName];

    const description = `You stand in ${biome.name}. The air is ${atmosphere}. A ${enemy} blocks your path.`;
    const flavorText = flavorFunc(`The ${enemy} eyes you consistently.`);

    return {
        description: `${description} ${flavorText}`,
        biome: biome,
        enemy: enemy,
        atmosphere: atmosphere,
        metadata: `Biome: ${biome.name}, Enemy: ${enemy}`
    };
}

// --- RENDER ENGINE ---

function applyTheme(biome) {
    // Remove all biome classes from body (assumes they start with biome-)
    // Actually our CSS doesn't have specific biome classes, we used tailwind.
    // We will simulate "Theme changes" by changing background gradients or specific element colors.

    const body = document.body;

    // Reset classes related to theme
    body.classList.remove('from-gray-900', 'from-blue-900', 'from-red-900', 'from-purple-900', 'from-green-900');

    // Apply new base color based on biome color
    let colorClass = 'from-gray-900';
    if (biome.color === 'blue') colorClass = 'from-blue-900';
    if (biome.color === 'red') colorClass = 'from-red-900';
    if (biome.color === 'violet') colorClass = 'from-purple-900';
    if (biome.color === 'neon') colorClass = 'from-teal-900';
    if (biome.color === 'orange') colorClass = 'from-orange-900';

    // Add a subtle gradient overlay to body
    body.classList.add('bg-gradient-to-br', colorClass, 'to-charcoal');

    // Also add the biome-ID class to support variables in styles.css
    // Remove old biome classes first (matching regex biome-*)
    body.className = body.className.replace(/\bbiome-\w+\b/g, '');
    body.classList.add(`biome-${biome.id}`);

    // Animate visual artifact
    const artifact = document.getElementById('visual-artifact');
    artifact.style.borderColor = biome.color === 'neon' ? '#0ff' : (biome.color === 'violet' ? '#d0f' : 'gold');
    artifact.className = `w-full aspect-square rounded-full border-4 shadow-lg flex items-center justify-center bg-charcoal transition-all duration-1000 ${biome.color === 'neon' ? 'animate-pulse' : ''}`;
}

function updateNarrative(text, type = 'normal', logUpdate = null) {
    const p = document.createElement('p');
    p.textContent = text;
    p.className = "animate-fade-in";
    if (type === 'crit') p.classList.add('text-green-400', 'font-bold');
    if (type === 'fail') p.classList.add('text-red-400', 'font-bold');

    ui.storyContainer.appendChild(p);

    // Scroll
    requestAnimationFrame(() => {
        const panel = document.getElementById('narrative-panel');
        panel.scrollTop = panel.scrollHeight;
    });

    // ARIA & TTS
    ui.liveRegion.textContent = text;
    speakText(text);

    // Log
    if (logUpdate) {
        const li = document.createElement('li');
        li.textContent = `> ${logUpdate}`;
        ui.gameLog.insertBefore(li, ui.gameLog.firstChild);
        triggerEcho(logUpdate);
    }
}

function updateStats() {
    ui.hpDisplay.textContent = `${state.player.hp} / ${state.player.maxHp}`;
    const hpPercent = (state.player.hp / state.player.maxHp) * 100;
    ui.hpBar.style.width = `${Math.max(0, hpPercent)}%`;
    ui.spellSlots.textContent = `${state.player.spellSlots}/${state.player.maxSpellSlots}`;

    if (state.player.hp <= 0) {
        endGame(false);
    }
}

function renderButtons() {
    const container = ui.actionPanel;
    container.innerHTML = "";

    const actions = [
        { label: "⚔️ Attack", id: "attack", desc: "Strike with your weapon." },
        { label: "🔍 Investigate", id: "investigate", desc: "Search for loot." },
        { label: "✨ Cast Spell", id: "spell", desc: "Unleash magic." }
    ];

    actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = "action-btn group relative w-full p-4 border border-gold/30 bg-charcoal hover:bg-charcoal-light transition-all rounded text-left focus:ring-2 focus:ring-gold";
        btn.innerHTML = `
            <span class="block text-lg font-bold text-gold group-hover:translate-x-1 transition-transform">${act.label}</span>
            <span class="block text-sm text-gray-400 mt-1">${act.desc}</span>
        `;
        btn.onclick = () => handleGameAction(act.id);
        container.appendChild(btn);
    });
}

// --- ACTIONS ---

function handleGameAction(type) {
    if (state.player.hp <= 0) return;

    const diff = calculateDifficulty();
    let roll = Math.floor(Math.random() * 20) + 1;
    let logMsg = "";
    let hpChange = 0;
    let nextRoom = false;

    if (type === "attack") {
        const dc = 12 * diff;
        if (roll >= dc) {
            logMsg = `CRITICAL HIT! (Roll: ${roll}). You defeat the ${state.game.currentEnemy}!`;
            state.player.wins++;
            nextRoom = true;
            ui.sfxHit.play().catch(e => {}); // Reuse hit sound or find a win sound
        } else {
            const damage = Math.floor(2 * diff);
            hpChange = -damage;
            state.player.hp -= damage;
            logMsg = `MISS! (Roll: ${roll}). The ${state.game.currentEnemy} counters, dealing ${damage} damage.`;
            triggerHaptic(500);
        }
    } else if (type === "investigate") {
        if (roll > 15) {
            logMsg = "You find a hidden potion! (+5 HP)";
            hpChange = 5;
            state.player.hp = Math.min(state.player.hp + 5, state.player.maxHp);
            triggerHaptic(100);
        } else {
            logMsg = "You find nothing but dust.";
        }
    } else if (type === "spell") {
        if (state.player.spellSlots > 0) {
            state.player.spellSlots--;
            logMsg = "Your spell blasts the area! The path clears.";
            state.player.wins++;
            nextRoom = true;
             // Play magic sound if available, else standard
        } else {
            logMsg = "You are out of spell slots! The spell fizzles.";
        }
    }

    updateStats();

    // Determine text type for color
    let textType = 'normal';
    if (logMsg.includes("CRITICAL") || logMsg.includes("blasts")) textType = 'crit';
    if (logMsg.includes("MISS") || logMsg.includes("out of")) textType = 'fail';

    updateNarrative(logMsg, textType, logMsg);

    if (nextRoom) {
        state.game.inBattle = false;
        setTimeout(() => {
            enterNextRoom();
        }, 2000);
    }
}

function enterNextRoom() {
    state.game.currentRoomId++;
    const content = generateRoomContent(Date.now());

    state.game.currentBiome = content.biome;
    state.game.currentAtmosphere = content.atmosphere;
    state.game.currentEnemy = content.enemy;
    state.game.inBattle = true;

    applyTheme(content.biome);
    updateNarrative(content.description);

    // Music Change
    playMusic('battle');
}

function endGame(victory) {
    ui.actionPanel.innerHTML = "";
    const msg = victory ? "You have conquered the vault!" : "You have fallen in battle.";
    updateNarrative(msg, victory ? 'crit' : 'fail');

    const btn = document.createElement('button');
    btn.textContent = "Restart Game";
    btn.className = "w-full p-4 bg-gold text-charcoal font-bold rounded mt-4";
    btn.onclick = () => location.reload();
    ui.actionPanel.appendChild(btn);
}

// --- SETUP & LISTENERS ---

function initGame() {
    const name = ui.charNameInput.value.trim() || "Unknown Hero";
    state.player.name = name;
    ui.displayCharName.textContent = name;

    // Hide start screen
    ui.startScreen.classList.add('opacity-0', 'pointer-events-none');

    // Init first room
    const content = generateRoomContent(Date.now());
    state.game.currentBiome = content.biome;
    state.game.currentEnemy = content.enemy;
    applyTheme(content.biome);

    setTimeout(() => {
        updateNarrative("Welcome to the Obsidian Vault.");
        setTimeout(() => {
            updateNarrative(content.description);
            renderButtons();
        }, 1000);
    }, 1000);

    // Try to start music if enabled
    if (state.game.isMusicPlaying) {
        playMusic('battle');
    }
}

// Events

ui.btnRandomName.addEventListener('click', () => {
    ui.charNameInput.value = generateRandomName();
});

ui.btnStartGame.addEventListener('click', initGame);

ui.btnMultiplayer.addEventListener('click', () => {
    alert("🔮 The ethereal planes of multiplayer are currently unstable! \n\nThe wizards are weaving the netcode spells. Please check back in a future age.");
});

ui.audioToggle.addEventListener('click', () => {
    if (state.game.isMusicPlaying) {
        state.game.isMusicPlaying = false;
        stopMusic();
        ui.audioToggle.textContent = "Start Music 🎵";
        ui.audioToggle.setAttribute('aria-label', "Start Background Music");
    } else {
        state.game.isMusicPlaying = true;
        playMusic(state.game.inBattle ? 'battle' : 'main');
        ui.audioToggle.textContent = "Mute Music 🔇";
        ui.audioToggle.setAttribute('aria-label', "Mute Background Music");
    }
});

ui.btnRepeat.addEventListener('click', () => {
    const lastP = ui.storyContainer.querySelector('p:last-child');
    if (lastP) speakText(lastP.textContent);
});

// Initial Setup
ui.charNameInput.value = generateRandomName();
