#!/usr/bin/env python3
"""
Tera Radar Mod - Python Integration Example

This script demonstrates how to read and process radar data from the Tera Radar Mod
for aimbot integration and real-time entity tracking.

Requirements:
    - Python 3.7+
    - No external dependencies (uses only standard library)

Usage:
    python python_integration.py [radar_output_file]
"""

import json
import time
import sys
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Position:
    """3D position coordinates"""
    x: float
    y: float
    z: float
    
    def distance_to(self, other: 'Position') -> float:
        """Calculate 3D distance to another position"""
        dx = self.x - other.x
        dy = self.y - other.y
        dz = self.z - other.z
        return (dx * dx + dy * dy + dz * dz) ** 0.5


@dataclass
class PlayerState:
    """Player state information"""
    position: Optional[Position]
    rotation: Optional[float]  # radians
    yaw: Optional[float]       # radians
    pitch: Optional[float]     # radians
    is_active: bool


@dataclass
class Entity:
    """Tracked entity information"""
    game_id: int
    name: str
    type: str  # 'Player', 'NPC', 'Monster'
    position: Position
    distance: float
    is_friendly: bool
    hp: Optional[int]
    max_hp: Optional[int]
    level: Optional[int]
    class_name: Optional[str]


@dataclass
class RadarData:
    """Complete radar data snapshot"""
    timestamp: str
    player: PlayerState
    entities: List[Entity]
    metadata: Dict


class RadarReader:
    """Fast NDJSON radar data reader with error handling"""
    
    def __init__(self, file_path: str = "radar_output.ndjson"):
        self.file_path = file_path
        self.last_modified = 0
        self.last_data = None
        
    def read_latest(self) -> Optional[RadarData]:
        """
        Read the latest radar data from file.
        Returns None if file doesn't exist or hasn't been updated.
        """
        try:
            # Check if file exists and has been modified
            if not os.path.exists(self.file_path):
                return None
                
            stat = os.stat(self.file_path)
            if stat.st_mtime <= self.last_modified:
                return self.last_data
                
            self.last_modified = stat.st_mtime
            
            # Read and parse the file
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                
            if not content:
                return None
                
            # Parse JSON data
            raw_data = json.loads(content)
            self.last_data = self._parse_radar_data(raw_data)
            return self.last_data
            
        except (FileNotFoundError, PermissionError):
            # File doesn't exist or can't be read
            return None
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error reading radar data: {e}")
            return None
    
    def _parse_radar_data(self, raw_data: Dict) -> RadarData:
        """Parse raw JSON data into structured RadarData object"""
        # Parse player state
        player_raw = raw_data.get('player', {})
        player_pos = None
        if player_raw.get('position'):
            pos_data = player_raw['position']
            player_pos = Position(
                x=pos_data.get('x', 0),
                y=pos_data.get('y', 0),
                z=pos_data.get('z', 0)
            )
        
        player = PlayerState(
            position=player_pos,
            rotation=player_raw.get('rotation'),
            yaw=player_raw.get('yaw'),
            pitch=player_raw.get('pitch'),
            is_active=player_raw.get('isActive', False)
        )
        
        # Parse entities
        entities = []
        for entity_raw in raw_data.get('entities', []):
            pos_data = entity_raw.get('position', {})
            position = Position(
                x=pos_data.get('x', 0),
                y=pos_data.get('y', 0),
                z=pos_data.get('z', 0)
            )
            
            entity = Entity(
                game_id=entity_raw.get('gameId', 0),
                name=entity_raw.get('name', 'Unknown'),
                type=entity_raw.get('type', 'Unknown'),
                position=position,
                distance=entity_raw.get('distance', 0),
                is_friendly=entity_raw.get('isFriendly', False),
                hp=entity_raw.get('hp'),
                max_hp=entity_raw.get('maxHp'),
                level=entity_raw.get('level'),
                class_name=entity_raw.get('class')
            )
            entities.append(entity)
        
        return RadarData(
            timestamp=raw_data.get('timestamp', ''),
            player=player,
            entities=entities,
            metadata=raw_data.get('metadata', {})
        )


class AimbotHelper:
    """Helper class for aimbot integration with position calculations"""
    
    def __init__(self, radar_reader: RadarReader):
        self.radar_reader = radar_reader
        
    def get_nearest_hostile(self) -> Optional[Entity]:
        """Get the nearest hostile entity"""
        data = self.radar_reader.read_latest()
        if not data or not data.player.is_active:
            return None
            
        hostile_entities = [
            entity for entity in data.entities 
            if not entity.is_friendly and entity.type in ['Monster', 'Player']
        ]
        
        if not hostile_entities:
            return None
            
        return min(hostile_entities, key=lambda e: e.distance)
    
    def get_entities_by_type(self, entity_type: str) -> List[Entity]:
        """Get all entities of a specific type"""
        data = self.radar_reader.read_latest()
        if not data:
            return []
            
        return [
            entity for entity in data.entities 
            if entity.type == entity_type
        ]
    
    def get_low_health_enemies(self, health_threshold: float = 0.3) -> List[Entity]:
        """Get enemies with health below threshold (as percentage)"""
        data = self.radar_reader.read_latest()
        if not data:
            return []
            
        low_health = []
        for entity in data.entities:
            if (not entity.is_friendly and 
                entity.hp is not None and 
                entity.max_hp is not None and 
                entity.max_hp > 0):
                
                health_percent = entity.hp / entity.max_hp
                if health_percent <= health_threshold:
                    low_health.append(entity)
        
        return sorted(low_health, key=lambda e: e.distance)
    
    def calculate_aim_angles(self, target: Entity) -> Optional[Tuple[float, float]]:
        """
        Calculate yaw and pitch angles needed to aim at target.
        Returns (yaw, pitch) in radians, or None if player position unavailable.
        """
        data = self.radar_reader.read_latest()
        if not data or not data.player.position:
            return None
            
        player_pos = data.player.position
        target_pos = target.position
        
        # Calculate relative position
        dx = target_pos.x - player_pos.x
        dy = target_pos.y - player_pos.y
        dz = target_pos.z - player_pos.z
        
        # Calculate horizontal distance for pitch calculation
        horizontal_distance = (dx * dx + dy * dy) ** 0.5
        
        # Calculate yaw (horizontal angle)
        import math
        yaw = math.atan2(dy, dx)
        
        # Calculate pitch (vertical angle)
        pitch = math.atan2(dz, horizontal_distance)
        
        return (yaw, pitch)
    
    def get_targeting_priority_list(self) -> List[Entity]:
        """
        Get entities sorted by targeting priority:
        1. Low health enemies (closest first)
        2. Hostile players (closest first)
        3. Monsters (closest first)
        """
        data = self.radar_reader.read_latest()
        if not data:
            return []
            
        # Separate entities by priority
        low_health = self.get_low_health_enemies(0.3)
        hostile_players = [e for e in data.entities if e.type == 'Player' and not e.is_friendly]
        monsters = [e for e in data.entities if e.type == 'Monster' and not e.is_friendly]
        
        # Sort each group by distance
        low_health.sort(key=lambda e: e.distance)
        hostile_players.sort(key=lambda e: e.distance)
        monsters.sort(key=lambda e: e.distance)
        
        # Combine in priority order
        return low_health + hostile_players + monsters


def example_basic_usage():
    """Basic usage example"""
    print("=== Basic Radar Data Reading ===")
    
    radar = RadarReader("radar_output.ndjson")
    
    for i in range(10):  # Read 10 updates
        data = radar.read_latest()
        if data:
            print(f"Update {i+1}:")
            print(f"  Player active: {data.player.is_active}")
            if data.player.position:
                pos = data.player.position
                print(f"  Player position: ({pos.x:.2f}, {pos.y:.2f}, {pos.z:.2f})")
            print(f"  Entities in range: {len(data.entities)}")
            
            # Show nearest entities
            if data.entities:
                nearest = min(data.entities, key=lambda e: e.distance)
                print(f"  Nearest entity: {nearest.name} ({nearest.type}) at {nearest.distance:.2f}m")
        else:
            print(f"Update {i+1}: No data available")
        
        time.sleep(0.1)  # 100ms polling


def example_aimbot_integration():
    """Aimbot integration example"""
    print("\n=== Aimbot Integration Example ===")
    
    radar = RadarReader("radar_output.ndjson")
    aimbot = AimbotHelper(radar)
    
    for i in range(20):  # Monitor for 20 updates
        # Get nearest hostile target
        target = aimbot.get_nearest_hostile()
        
        if target:
            print(f"Target acquired: {target.name} ({target.type})")
            print(f"  Distance: {target.distance:.2f}m")
            print(f"  Health: {target.hp}/{target.max_hp}" if target.hp else "  Health: Unknown")
            
            # Calculate aim angles
            angles = aimbot.calculate_aim_angles(target)
            if angles:
                yaw, pitch = angles
                import math
                yaw_deg = math.degrees(yaw)
                pitch_deg = math.degrees(pitch)
                print(f"  Aim angles: Yaw={yaw_deg:.1f}°, Pitch={pitch_deg:.1f}°")
                
                # Here you would send mouse movement commands to aim at the target
                # Example: move_mouse_to_angle(yaw, pitch)
        else:
            print("No hostile targets in range")
        
        time.sleep(0.05)  # 50ms polling for responsive aiming


def example_advanced_targeting():
    """Advanced targeting example with priority system"""
    print("\n=== Advanced Targeting Example ===")
    
    radar = RadarReader("radar_output.ndjson")
    aimbot = AimbotHelper(radar)
    
    for i in range(15):
        priority_targets = aimbot.get_targeting_priority_list()
        
        if priority_targets:
            print(f"Priority target list ({len(priority_targets)} targets):")
            for j, target in enumerate(priority_targets[:5]):  # Show top 5
                health_info = ""
                if target.hp and target.max_hp:
                    health_pct = (target.hp / target.max_hp) * 100
                    health_info = f" ({health_pct:.0f}% HP)"
                
                print(f"  {j+1}. {target.name} ({target.type}) - {target.distance:.1f}m{health_info}")
            
            # Target the highest priority
            primary_target = priority_targets[0]
            angles = aimbot.calculate_aim_angles(primary_target)
            if angles:
                yaw, pitch = angles
                print(f"  → Targeting: {primary_target.name} at angles ({math.degrees(yaw):.1f}°, {math.degrees(pitch):.1f}°)")
        else:
            print("No targets available")
        
        time.sleep(0.1)


def main():
    """Main function with command line argument support"""
    # Check for custom file path
    file_path = "radar_output.ndjson"
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    
    print(f"Tera Radar Mod - Python Integration Example")
    print(f"Reading from: {file_path}")
    print(f"Make sure the Tera Radar Mod is running and outputting data!")
    print("-" * 60)
    
    # Update the radar reader with custom path
    RadarReader.__init__ = lambda self, fp=file_path: setattr(self, 'file_path', fp) or setattr(self, 'last_modified', 0) or setattr(self, 'last_data', None)
    
    try:
        # Run examples
        example_basic_usage()
        example_aimbot_integration()
        example_advanced_targeting()
        
    except KeyboardInterrupt:
        print("\nStopped by user")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()