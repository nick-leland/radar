# Player Position Logger

A simple TERA mod that logs and displays the player's current position in the game world.

## Features

- **Real-time position tracking**: Monitors player movement through game packets
- **Multiple direction sources**: Tracks facing direction from various packet types
- **Periodic logging**: Logs position every 5 seconds when enabled
- **Command interface**: Use `/pos`, `/direction`, and `/poslog` commands
- **Flying support**: Tracks position while flying as well as walking/running

## How to Get Player Position

The mod demonstrates several ways to access the player's current position:

### 1. Direct Access via mod.game.me.loc
```javascript
if (mod.game.me && mod.game.me.loc) {
    const position = mod.game.me.loc;
    console.log(`Position: X=${position.x}, Y=${position.y}, Z=${position.z}, W=${position.w}`);
}
```

### 2. Hook into Movement Packets
```javascript
// Player walking/running movement
mod.hook('C_PLAYER_LOCATION', 5, (event) => {
    const position = event.loc; // {x, y, z, w}
    const lookDirection = event.lookDirection; // More accurate facing direction
    console.log('Player moved to:', position);
    console.log('Look direction:', lookDirection);
});

// Player flying movement  
mod.hook('C_PLAYER_FLYING_LOCATION', 4, (event) => {
    const position = event.loc; // {x, y, z, w}
    const direction = event.direction; // Direction vector
    console.log('Player flying to:', position);
    console.log('Direction vector:', direction);
});
```

### 3. Get Accurate Facing Direction
The `w` value in position data often returns 0. Here are better sources for direction:

#### A. Look Direction (Most Reliable)
```javascript
mod.hook('C_PLAYER_LOCATION', 5, (event) => {
    if (event.lookDirection !== undefined) {
        console.log('Facing direction:', event.lookDirection); // In radians
    }
});
```

#### B. User Aim Data
```javascript
mod.hook('C_USER_AIM', 1, (event) => {
    console.log('Aim Yaw:', event.yaw); // Horizontal rotation
    console.log('Aim Pitch:', event.pitch); // Vertical rotation
});
```

#### C. Flying Direction Vector
```javascript
mod.hook('C_PLAYER_FLYING_LOCATION', 4, (event) => {
    console.log('Direction vector:', event.direction); // {x, y, z} normalized vector
});
```

### 4. Position Data Structure
The position object contains:
- `x`: X coordinate (horizontal)
- `y`: Y coordinate (vertical/height) 
- `z`: Z coordinate (depth)
- `w`: Rotation/facing direction (often 0, use lookDirection instead)

## Why W is Often 0

The `w` value in position packets often returns 0 because:
1. **Movement vs. Direction**: The `w` field represents movement direction, not facing direction
2. **Look Direction**: The actual facing direction is stored in `lookDirection` field
3. **Aim System**: For precise direction, use `C_USER_AIM` packets with yaw/pitch
4. **Flying**: When flying, direction is stored as a 3D vector in `direction` field

## Commands

- `/pos` - Display current player position and available direction data
- `/direction` - Show detailed direction information from all sources
- `/poslog` - Toggle automatic position logging on/off

## Installation

1. Place this mod in your TERA Toolbox mods folder
2. Restart TERA Toolbox
3. Enable the mod in the Toolbox interface

## Technical Details

The mod uses the following packet hooks to track position and direction:
- `C_PLAYER_LOCATION` (version 5) - Ground movement + lookDirection
- `C_PLAYER_FLYING_LOCATION` (version 4) - Flying movement + direction vector
- `C_USER_AIM` (version 1) - Precise aiming direction (yaw/pitch)
- `C_NOTIFY_LOCATION_IN_ACTION` (version 4) - Direction during skills
- `C_NOTIFY_LOCATION_IN_DASH` (version 4) - Direction during dashes
- `S_USER_LOCATION` (version 6) - Server-side location with lookDirection
- `mod.game.me.loc` - Current cached position from the game state

Position data is automatically updated by the TERA Toolbox library when these packets are received.