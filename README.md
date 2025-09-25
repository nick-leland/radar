# Tera Radar Mod

A high-performance TERA Toolbox modification that provides real-time entity tracking and radar functionality for the TERA MMORPG. The mod intercepts game packets to track player position, nearby entities (players, NPCs, monsters), and outputs structured data for external consumption by Python scripts and automation tools.

## Features

- **Real-time Position Tracking**: Monitors player movement and facing direction with sub-50ms latency
- **Entity Radar System**: Tracks all visible entities with distance calculations and filtering
- **Data Export**: Outputs comprehensive game state data in NDJSON format for external analysis
- **Python Integration**: Complete Python examples for aimbot integration and automation
- **Command Interface**: In-game commands for configuration and manual scanning
- **Modular Architecture**: Clean separation of concerns with dedicated classes for different responsibilities
- **High Performance**: Optimized for external consumption with atomic file operations
- **Configurable**: Adjustable radar radius, update intervals, and entity filtering

## Quick Start

1. **Install the mod** in your TERA Toolbox mods folder
2. **Start TERA** and load into the game
3. **Test the mod**: Use `radartest` or `radar test` command in-game
4. **Enable radar output**: Use `radarstart` or `radar start` command
5. **Run Python integration**: `python examples/python_integration.py`

### First Time Setup

After installing and loading into TERA:

```
# Test that commands work
radartest

# Check system status  
radarstatus

# Start radar output
radarstart

# Verify output is working
radaroutput
```

## Radar System

### Core Functionality

The radar system provides real-time tracking of all entities in the game world:

- **Entity Tracking**: Automatically tracks players, NPCs, and monsters as they spawn/despawn
- **Position Updates**: Real-time position updates with 50ms refresh rate
- **Distance Calculation**: 3D distance calculations from player position
- **Health Monitoring**: Tracks HP, mana, and status changes
- **Classification**: Distinguishes between entity types and friendly/hostile status

### Data Output Format

The mod outputs structured data to `radar_output.ndjson`:

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "player": {
    "position": {"x": 123.45, "y": 67.89, "z": 12.34},
    "rotation": 1.57,
    "yaw": 1.57,
    "pitch": 0.12,
    "isActive": true
  },
  "entities": [
    {
      "gameId": 123456789,
      "name": "Goblin Scout",
      "type": "Monster",
      "position": {"x": 145.67, "y": 68.12, "z": 15.78},
      "distance": 23.4,
      "isFriendly": false,
      "hp": 800,
      "maxHp": 1200,
      "level": 45,
      "class": null
    }
  ],
  "metadata": {
    "entitiesInRadius": 3,
    "radarRadius": 50,
    "totalEntitiesTracked": 15
  }
}
```

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

The TERA Radar Mod provides two command interfaces: **individual commands** and a **subcommand system**. Both interfaces provide the same functionality with different syntax options.

### Individual Commands

These commands work directly without any prefix:

- `radarstart` - Start continuous radar data output to file
- `radarstop` - Stop radar data output  
- `radarstatus` - Display current radar system status
- `radarconfig [key] [value]` - View or modify configuration settings
- `radarradius <number>` - Set radar scanning radius (1-1000 meters)
- `radaroutput` - Show current output status and file location
- `radarperf` - Display performance metrics and statistics
- `radarbench` - Run performance benchmark test
- `radartest` - Test command functionality

### Subcommand System

Use `radar <subcommand>` or the short alias `r <subcommand>`:

#### Basic Control
- `radar start` or `radar on` - Start continuous radar output (same as `radarstart`)
- `radar stop` or `radar off` - Stop radar output (same as `radarstop`)
- `radar status` or `radar s` - Show system status (same as `radarstatus`)

#### Configuration
- `radar config` - Show all configuration settings
- `radar config <key>` - Show specific configuration value
- `radar config <key> <value>` - Set configuration value
- `radar radius <number>` - Set scanning radius (same as `radarradius`)

#### Information & Testing
- `radar output` or `radar out` - Show output file status (same as `radaroutput`)
- `radar perf` or `radar performance` - Show performance metrics (same as `radarperf`)
- `radar bench` or `radar benchmark` - Run benchmark (same as `radarbench`)
- `radar test` - Test command functionality (same as `radartest`)
- `radar help` or `radar ?` - Show command help

#### Manual Scanning
- `radar` - Perform manual radar scan with default radius
- `radar <number>` - Perform manual scan with custom radius (e.g., `radar 200`)

### Command Examples

#### Starting and Stopping Radar Output
```
# Individual commands
radarstart
radarstop

# Subcommand system  
radar start
radar stop
r on
r off
```

#### Configuration Management
```
# View all settings
radarconfig
radar config

# View specific setting
radar config radarRadius

# Change settings
radarradius 150
radar radius 150
radar config updateInterval 100
```

#### Manual Scanning
```
# Default radius scan
radar

# Custom radius scan
radar 200
r 75

# Check what entities are nearby
radar status
```

#### Performance Monitoring
```
# Check performance
radarperf
radar performance

# Run benchmark
radarbench  
radar bench
```

### Configuration Keys

Valid configuration keys for `radarconfig` and `radar config`:

- `radarRadius` - Scanning radius in meters (1-1000)
- `updateInterval` - Update frequency in milliseconds  
- `outputFile` - Output file name
- `includeNPCs` - Include NPCs in tracking (true/false)
- `includeMonsters` - Include monsters in tracking (true/false)
- `includePlayers` - Include players in tracking (true/false)
- `includeHealthData` - Include health information (true/false)
- `logLevel` - Logging verbosity (error/warn/info/debug)

### Troubleshooting Commands

#### Command Not Working?

1. **Test basic functionality:**
   ```
   radartest
   radar test
   ```

2. **Check system status:**
   ```
   radarstatus
   radar status
   ```

3. **Verify game connection:**
   - Commands may not work immediately after entering game
   - Wait for "Radar system ready" message
   - Try again after game world fully loads

#### Common Issues

**"Radar system not ready" message:**
- Wait for game to fully load before using commands
- Some commands (test, status, help) work during initialization
- Other commands require complete game connection

**Individual commands not working:**
- The mod automatically falls back to subcommand system
- Use `radar <subcommand>` instead of individual commands
- Check chat for registration status messages

**"Unknown subcommand" error:**
- Use `radar help` to see all available subcommands
- Check spelling and syntax
- Some subcommands have aliases (e.g., `s` for `status`)

**Configuration errors:**
- Use valid configuration keys (see list above)
- Check value types (numbers for radius, true/false for booleans)
- Use `radar config` to see current settings

#### Getting Help

- `radar help` - Complete command reference
- `radarstatus` - Current system state
- `radar config` - Current configuration
- Check TERA Toolbox console for detailed error messages

## Installation

1. **Download** or clone this repository
2. **Copy** the mod folder to your TERA Toolbox mods directory
3. **Restart** TERA Toolbox
4. **Load** into TERA and enter the game world
5. **Wait for initialization**: Look for "Radar system ready" message
6. **Test commands**: Use `radartest` to verify functionality
7. **Start radar**: Use `radarstart` or `radar start` to begin data output

### System Requirements

- **TERA Toolbox**: Latest version recommended
- **Game State**: Must be fully loaded into game world
- **Connection**: Stable connection to TERA servers
- **Permissions**: Write access to mod directory for output files

### Command System Compatibility

The mod uses a **dual command system** for maximum compatibility:

- **Individual Commands**: Direct commands like `radarstart`, `radarstop`
- **Subcommand System**: Unified interface like `radar start`, `radar stop`
- **Automatic Fallback**: If individual commands fail, subcommand system provides backup
- **Error Handling**: Clear feedback when commands are unavailable

## Python Integration

The mod includes comprehensive Python integration examples in the `examples/` directory:

- **`python_integration.py`** - Complete integration example with aimbot helpers
- **`examples/README.md`** - Detailed Python integration documentation

### Basic Usage
```python
from examples.python_integration import RadarReader, AimbotHelper

# Read radar data
radar = RadarReader("radar_output.ndjson")
data = radar.read_latest()

# Aimbot integration
aimbot = AimbotHelper(radar)
target = aimbot.get_nearest_hostile()
if target:
    angles = aimbot.calculate_aim_angles(target)
```

### Requirements
- Python 3.7+
- No external dependencies (uses standard library only)

## Architecture

The mod uses a modular architecture with the following components:

- **TeraRadarMod** - Main orchestrator class with dual command system
- **EntityTracker** - Manages entity lifecycle and spatial tracking  
- **DataProcessor** - Transforms raw packet data into standardized formats
- **FileOutputManager** - Handles atomic file operations
- **ConfigManager** - Manages configuration and settings
- **Command System** - Dual interface supporting individual and subcommands

### Command Architecture

The mod implements a **robust dual command system**:

#### Individual Command Registration
- Registers commands like `radarstart`, `radarstop`, `radarstatus`
- Each command has dedicated error handling and validation
- Fallback mechanisms when registration fails

#### Subcommand System  
- Unified `radar` command with subcommand parsing
- Short alias `r` for quick access
- Comprehensive help system and parameter validation
- Consistent error handling across all subcommands

#### Error Handling & Fallback
- Graceful degradation when individual commands fail
- Automatic fallback to subcommand system
- Clear user feedback about command availability
- System readiness checks before command execution

### Packet Hooks

**Player Position & Aim:**
- `C_PLAYER_LOCATION` (v5) - Player movement and rotation
- `C_USER_AIM` (v1) - Precise aiming direction (yaw/pitch)

**Entity Tracking:**
- `S_SPAWN_USER` (v15/16) - Player spawns
- `S_SPAWN_NPC` (v11) - NPC/Monster spawns
- `S_DESPAWN_USER` (v3) - Player despawns
- `S_DESPAWN_NPC` (v3) - NPC/Monster despawns
- `S_USER_LOCATION` (v6) - Player movement updates
- `S_NPC_LOCATION` (v3) - NPC movement updates
- `S_CREATURE_CHANGE_HP` (v6) - Health updates

## Configuration

The mod uses `config.json` for settings:

```json
{
  "radarRadius": 50,
  "updateInterval": 50,
  "outputFile": "radar_output.ndjson",
  "includeNPCs": true,
  "includeMonsters": true,
  "includePlayers": true,
  "includeHealthData": true,
  "logLevel": "info"
}
```

## Performance

- **Update Rate**: 50ms default (20 FPS)
- **File I/O**: Atomic writes prevent partial reads
- **Memory**: Efficient entity cleanup and spatial indexing
- **Latency**: Sub-50ms from game event to file output

## Use Cases

- **Aimbot Integration**: Real-time targeting data for automation
- **Game Analysis**: Entity tracking and movement pattern analysis
- **Radar Functionality**: Enhanced situational awareness
- **Data Logging**: Comprehensive game state recording


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in-game
5. Submit a pull request

## License

This project is provided as-is for educational and research purposes. Use responsibly and in accordance with TERA's terms of service.