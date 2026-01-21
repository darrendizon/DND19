import sqlite3
import random
import uuid
import json
from contextlib import asynccontextmanager, closing
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# --- DATA MODELS ---

class PlayerState(BaseModel):
    player_id: str
    current_hp: int
    max_hp: int
    ac: int
    spell_slots: int
    max_spell_slots: int
    wins: int

class ActionOption(BaseModel):
    label: str
    action_type: str
    description: str

class RoomResponse(BaseModel):
    description: str
    biome: str
    options: List[ActionOption]
    metadata: str
    player_state: PlayerState
    log_update: Optional[str] = None
    hp_change: int = 0  # For Haptic Feedback

class ActionRequest(BaseModel):
    player_id: str
    action_type: str

# --- CONFIG & DATABASE ---

DB_FILE = "game.db"

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        with open("schema.sql", "r") as f:
            conn.executescript(f.read())

@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_in_threadpool(init_db)
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WORLD LOGIC MODULES ---

BIOMES = [
    {"name": "The Iron Tundra", "id": "tundra", "color": "blue"},
    {"name": "The Bioluminescent Veins", "id": "veins", "color": "neon"},
    {"name": "The Clockwork Canopy", "id": "clockwork", "color": "orange"},
    {"name": "The Sea of Glass", "id": "glass", "color": "white"},
    {"name": "The Floating Archipelago", "id": "archipelago", "color": "violet"},
    {"name": "The Crimson Marsh", "id": "marsh", "color": "red"},
]

ATMOSPHERES = [
    "heavy with static", "smelling of ozone", "unnaturally silent",
    "shifting with shadows", "bone-chillingly cold", "thin and ethereal"
]

ENEMIES = {
    "tundra": ["Frost Giant Sentinel", "Shard Wolf"],
    "veins": ["Deep-Dwelling Gloom", "Spore Berzerker"],
    "clockwork": ["Brass Automaton", "Gear-Grinder Golem"],
    "glass": ["Mirror Wraith", "Sun-Scorched Stalker"],
    "archipelago": ["Wind Drake", "Void Ray"],
    "marsh": ["Blood-Lily Siren", "Rotting Hulk"]
}

# Linguistic Flavor (Mod 14)
DIALECTS = {
    "archaic": lambda text: f"Hark! {text} Verily, danger abounds.",
    "slang": lambda text: f"Yo, listen up. {text} Watch your back.",
    "formal": lambda text: f"Attention. {text} Proceed with caution.",
    "mystic": lambda text: f"The spirits whisper... {text} Fate is watching."
}

def get_db():
    return sqlite3.connect(DB_FILE)

# --- GAME ENGINE ---

def calculate_difficulty(wins: int) -> float:
    # Adaptive Difficulty (Mod 15)
    # Increase difficulty by 10% for every 5 wins
    return 1.0 + (wins // 5) * 0.1

def generate_room_content(seed: int, wins: int):
    random.seed(seed)

    biome = random.choice(BIOMES)
    atmosphere = random.choice(ATMOSPHERES)

    # Select enemy based on biome (Coherency)
    enemy = random.choice(ENEMIES[biome["id"]])

    # Select dialect based on biome seed (consistent for the biome instance)
    dialect_keys = list(DIALECTS.keys())
    dialect_name = dialect_keys[seed % len(dialect_keys)]
    flavor_func = DIALECTS[dialect_name]

    description = f"You stand in {biome['name']}. The air is {atmosphere}. A {enemy} blocks your path."
    flavor_text = flavor_func(f"The {enemy} eyes you consistently.")

    full_description = f"{description} {flavor_text}"

    return {
        "description": full_description,
        "biome": biome["id"],
        "metadata": f"Biome: {biome['name']}, Enemy: {enemy}, Atmosphere: {atmosphere}"
    }

# --- API ENDPOINTS ---

@app.get("/")
async def read_root():
    return FileResponse("index.html")

@app.get("/styles.css")
async def read_css():
    return FileResponse("styles.css")

@app.get("/script.js")
async def read_js():
    return FileResponse("script.js")

@app.post("/start", response_model=RoomResponse)
def start_game():
    player_id = str(uuid.uuid4())
    world_seed = random.randint(1, 1000000)

    with closing(get_db()) as conn:
        cursor = conn.cursor()

        # Initialize Player
        cursor.execute("INSERT INTO players (id, world_seed) VALUES (?, ?)", (player_id, world_seed))

        # Initialize GameState
        cursor.execute("""
            INSERT INTO gamestate (player_id, current_hp, max_hp, ac, spell_slots, max_spell_slots, current_room_id)
            VALUES (?, 42, 42, 18, 3, 3, 1)
        """, (player_id,))

        conn.commit()

    # Generate First Room
    content = generate_room_content(world_seed + 1, 0) # room_id = 1

    state = PlayerState(
        player_id=player_id, current_hp=42, max_hp=42, ac=18, spell_slots=3, max_spell_slots=3, wins=0
    )

    return RoomResponse(
        description=content["description"],
        biome=content["biome"],
        options=[
            ActionOption(label="⚔️ Attack", action_type="attack", description="Strike with your weapon."),
            ActionOption(label="🔍 Investigate", action_type="investigate", description="Look for clues."),
            ActionOption(label="✨ Cast Spell", action_type="spell", description="Unleash magic.")
        ],
        metadata=content["metadata"],
        player_state=state,
        log_update="Welcome to the Obsidian Vault."
    )

@app.post("/action", response_model=RoomResponse)
def handle_action(request: ActionRequest):
    with closing(get_db()) as conn:
        cursor = conn.cursor()

        # Fetch State
        row = cursor.execute("""
            SELECT p.world_seed, p.wins, g.current_hp, g.max_hp, g.ac, g.spell_slots, g.max_spell_slots, g.current_room_id
            FROM gamestate g
            JOIN players p ON g.player_id = p.id
            WHERE g.player_id = ?
        """, (request.player_id,)).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Player not found")

        world_seed, wins, hp, max_hp, ac, slots, max_slots, room_id = row

        difficulty = calculate_difficulty(wins)
        hp_change = 0
        log_msg = ""
        next_room_id = room_id

        # ACTION LOGIC
        # Uses random but logic logic resides here (The Brain)
        roll = random.randint(1, 20)

        if request.action_type == "attack":
            dc = 12 * difficulty # Harder as you win
            if roll >= dc:
                log_msg = f"CRITICAL HIT! (Roll: {roll}). You defeat the enemy!"
                wins += 1
                next_room_id += 1 # Advance
            else:
                damage = int(2 * difficulty)
                hp_change = -damage
                hp -= damage
                log_msg = f"MISS! (Roll: {roll}). The enemy counters, dealing {damage} damage."

        elif request.action_type == "investigate":
            if roll > 15:
                log_msg = "You find a hidden cache of supplies! (+2 HP)"
                hp_change = 2
                hp = min(hp + 2, max_hp)
            else:
                log_msg = "You find nothing but dust."

        elif request.action_type == "spell":
            if slots > 0:
                slots -= 1
                log_msg = "Your spell blasts the area with arcane force! The path clears."
                wins += 1 # Treating spell as auto-win for simplicity for now, or simplify logic
                next_room_id += 1
            else:
                log_msg = "You are out of spell slots! Nothing happens."

        # Update DB
        cursor.execute("""
            UPDATE gamestate
            SET current_hp = ?, spell_slots = ?, current_room_id = ?
            WHERE player_id = ?
        """, (hp, slots, next_room_id, request.player_id))

        cursor.execute("UPDATE players SET wins = ? WHERE id = ?", (wins, request.player_id))
        conn.commit()

    # Generate Next Room (if moved) or Current Room Content
    # If we moved, use next room ID. If not, same room ID.
    # Note: If we stay in room, content might be same?
    # For "Infinite" feel, let's assume if enemy defeated (wins increased), we regenerate or move.
    # If we failed attack, we stay.

    content = generate_room_content(world_seed + next_room_id, wins)

    new_state = PlayerState(
        player_id=request.player_id, current_hp=hp, max_hp=max_hp, ac=ac,
        spell_slots=slots, max_spell_slots=max_slots, wins=wins
    )

    return RoomResponse(
        description=content["description"] if next_room_id != room_id else f"You are still in battle. {content['description']}",
        biome=content["biome"],
        options=[
            ActionOption(label="⚔️ Attack", action_type="attack", description="Strike with your weapon."),
            ActionOption(label="🔍 Investigate", action_type="investigate", description="Look for clues."),
            ActionOption(label="✨ Cast Spell", action_type="spell", description="Unleash magic.")
        ],
        metadata=content["metadata"],
        player_state=new_state,
        log_update=log_msg,
        hp_change=hp_change
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
