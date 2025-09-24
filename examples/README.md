# Tera Radar Mod - Python Integration

This directory contains Python integration examples and documentation for consuming radar data from the Tera Radar Mod.

## Quick Start

1. **Start the Tera Radar Mod** in TERA Toolbox and use `/radarstart` to begin data output
2. **Run the Python example**: `python python_integration.py`
3. **Check the output file**: The mod outputs to `radar_output.ndjson` by default

## Files

- `python_integration.py` - Complete Python integration example with aimbot helpers
- `README.md` - This documentation file

## Python Integration Example

The `python_integration.py` script demonstrates three main use cases:

### 1. Basic Radar Data Reading
```python
from python_integration import RadarReader

radar = RadarReader("radar_output.ndjson")
data = radar.read_latest()

if data and data.player.is_active:
    print(f"Player position: {data.player.position}")
    print(f"Entities in range: {len(data.entities)}")
```

### 2. Aimbot Integration
```python
from python_integration import AimbotHelper

aimbot = AimbotHelper(radar)
target = aimbot.get_nearest_hostile()

if target:
    angles = aimbot.calculate_aim_angles(target)
    if angles:
        yaw, pitch = angles
        # Send mouse movement commands here
```

### 3. Advanced Targeting
```python
# Get prioritized target list (low health enemies first)
priority_targets = aimbot.get_targeting_priority_list()

# Get entities by type
monsters = aimbot.get_entities_by_type('Monster')
players = aimbot.get_entities_by_type('Player')

# Get low health enemies
low_health = aimbot.get_low_health_enemies(0.3)  # 30% health threshold
```

## Data Format

The radar outputs NDJSON format with this structure:

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

## Performance Notes

- **Update Frequency**: Data updates every 50ms by default
- **File Reading**: Uses file modification time checking to avoid unnecessary reads
- **Memory Efficient**: Parses only when file changes, caches last result
- **Error Handling**: Graceful handling of missing files, JSON errors, and permission issues

## Requirements

- Python 3.7+
- No external dependencies (uses only standard library)
- Tera Radar Mod running and outputting data

## Usage Tips

1. **Polling Frequency**: Don't poll faster than the mod's update rate (50ms default)
2. **File Location**: The default output file is `radar_output.ndjson` in the mod directory
3. **Error Handling**: Always check if data is None before using it
4. **Performance**: The RadarReader caches data and only re-reads when the file changes

## Integration Examples

### Mouse Movement (Windows)
```python
import ctypes
from ctypes import wintypes

def move_mouse_to_angle(yaw, pitch):
    # Convert angles to screen coordinates and move mouse
    # Implementation depends on your specific requirements
    pass
```

### Keyboard Automation
```python
import keyboard

def auto_target_nearest():
    target = aimbot.get_nearest_hostile()
    if target:
        keyboard.press_and_release('tab')  # Target nearest enemy
```

### Real-time Monitoring
```python
import time

def monitor_radar():
    radar = RadarReader()
    while True:
        data = radar.read_latest()
        if data:
            # Process radar data
            process_entities(data.entities)
        time.sleep(0.05)  # 50ms polling
```