# Radar Output Control Commands

This document explains how to use the radar output control commands in the Tera Radar Mod.

## Available Commands

### Basic Commands
- `radar` or `r` - Perform a radar scan and display nearby entities
- `radar status` or `radar s` - Show current mod status and configuration
- `radar test` - Test if the mod is loaded and working

### Output Control Commands
- `radar start` or `radar on` - Begin continuous file output to radar_output.ndjson
- `radar stop` or `radar off` - Stop continuous file output
- `radar output` or `radar out` - Show current output status and file information

### Configuration Commands
- `radar config` or `radar cfg` - Show all configuration settings
- `radar config <key>` - Show specific configuration value
- `radar config <key> <value>` - Set configuration value
- `radar radius <number>` - Set radar radius in meters

### Performance Commands
- `radar perf` - Show detailed performance metrics
- `radar bench` - Run a quick performance benchmark

### Short Aliases
- `r` - Quick radar scan (same as `radar`)
- `r start` / `r stop` - Quick output control
- `r s` - Quick status check

## Usage Examples

### Getting Started
1. **Enter TERA Toolbox chat mode**: Type `/8` in-game to switch to toolbox chat
2. **Test the mod**: Type `radar test` to verify the mod is loaded
3. **Check status**: Type `radar status` to see initialization status

### Starting Radar Output
```
/8                  (switch to toolbox chat)
radar start         (begin continuous output)
  or
radar on            (shorter alias)
```
This will begin writing radar data to `radar_output.ndjson` every 50ms (configurable).

### Stopping Radar Output
```
/8                  (switch to toolbox chat)
radar stop          (halt continuous output)
  or
radar off           (shorter alias)
```
This will halt the continuous file output.

### Checking Output Status
```
/8                  (switch to toolbox chat)
radar output        (show output status)
```
Shows whether output is running, file location, and current data status.

### Configuring Radar Radius
```
/8                  (switch to toolbox chat)
radar radius 100    (set radius to 100 meters)
```
Sets the radar radius to 100 meters.

### Checking Status
```
/8                  (switch to toolbox chat)
radar status        (show comprehensive status)
```
Shows comprehensive status including:
- Configuration settings
- Packet interceptor status
- Entity tracker statistics
- File output system status

## File Output Format

The radar output is written to `radar_output.ndjson` in JSON format:

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "player": {
    "position": { "x": 123.45, "y": 67.89, "z": 12.34 },
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
      "position": { "x": 145.67, "y": 68.12, "z": 15.78 },
      "distance": 23.4,
      "isFriendly": false,
      "hp": 800,
      "maxHp": 1200,
      "level": 45
    }
  ],
  "metadata": {
    "entitiesInRadius": 3,
    "radarRadius": 50,
    "totalEntitiesTracked": 15
  }
}
```

## Troubleshooting

### Command Not Working
1. Check if the mod is loaded: `/radar test`
2. Check mod status: `/radar status`
3. Look for error messages in the TERA Toolbox console

### Output Not Starting
1. Ensure you're in-game (not in character select)
2. Check if file output manager is initialized: `/radar status`
3. Try stopping and starting again: `/radar stop` then `/radar start`

### No Entities Detected
1. Move around to trigger position updates
2. Check if entities are within radar radius: `/radar status`
3. Verify packet interceptor is active: `/radar status`

## Performance Notes

- Default update interval is 50ms for optimal performance
- File operations are atomic to prevent partial reads
- Distance calculations are cached for efficiency
- Spatial indexing is used for fast entity queries