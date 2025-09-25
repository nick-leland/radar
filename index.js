'use strict';

const DataProcessor = require('./lib/DataProcessor');
const EntityTracker = require('./lib/EntityTracker');
const PacketInterceptor = require('./lib/PacketInterceptor');
const zmq = require("zeromq")

// Constants
const radar_interval = 1500;
const radar_radius = 1000;

async function create_socket() {
    try {
        const sock = new zmq.Publisher()
        await sock.bind("tcp://127.0.0.1:3000")
        mod.log("Publisher bound to port 3000")
        return sock
    } catch (error) {
        mod.error(`[TeraRadarMod] Error creating socket: ${error.message}`);
        return null
    }
}

async function send_to_server(data, sock, radar_interval) {
    try {
      mod.log("Sending data to server")
      await sock.send([data])
    } catch (error) {
        mod.error(`[TeraRadarMod] Error sending data to server: ${error.message}`);
    }
}


module.exports = async function TeraRadarModMain(mod) {
    mod.log('[TeraRadarMod] Creating DataProcessor...');
    // Initialize DataProcessor
    const dataProcessor = new DataProcessor();

    mod.log('[TeraRadarMod] Creating EntityTracker...');
    // Initialize EntityTracker with radar radius from config
    const entityTracker = new EntityTracker(radar_radius);

    mod.log('[TeraRadarMod] Creating PacketInterceptor...');
    // Initialize PacketInterceptor with dependencies
    const packetInterceptor = new PacketInterceptor(
        mod,
        dataProcessor,
        entityTracker
    );

    mod.game.on('enter_game', async () => {
        mod.log('[TeraRadarMod] Entered game - initializing systems');

        const sock = await create_socket();

        // Initialize portion to begin tracing those packages
        try {
            packetInterceptor.initializeHooks();
            mod.log('[TeraRadarMod] Packet interceptor hooks initialized successfully');
        } catch (error) {
            mod.error(`[TeraRadarMod] Error initializing packet interceptor: ${error.message}`);
        }

        // Set up periodic radar data sending
        const radarInterval = setInterval(async () => {
            try {
                // Combine all the data into a single object 
                // (Player position and other entities)
                const { position: character_position, rotation, yaw, pitch, isActive } = packetInterceptor.getPlayerState();
                const entities = entityTracker.getEntitiesInRadius();
                const entity_output = {
                    "player": {
                        "position": character_position,
                        "rotation": rotation,
                        "yaw": yaw,
                        "pitch": pitch,
                        "isActive": isActive
                    },
                    "entities": entities
                };

                // Send the data to the server
                await send_to_server(JSON.stringify(entity_output), sock);
            } catch (error) {
                mod.error(`[TeraRadarMod] Error in radar interval: ${error.message}`);
            }
        }, radar_interval);

        // TODO: Add some sort of in game call to view the last sent data

        // Clean up interval when leaving game
        mod.game.on('leave_game', () => {
            if (radarInterval) {
                clearInterval(radarInterval);
                mod.log('[TeraRadarMod] Radar interval cleared');
            }
        });

    });

    
};
