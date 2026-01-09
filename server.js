const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis'); // Added Redis for Render persistence
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- DATABASE CONFIGURATION ---
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => console.log('Redis Connection Error:', err));

async function startServer() {
    // 1. Connect to Redis Database
    await redisClient.connect();
    console.log("Connected to Redis successfully");

    // 2. Load existing data from Redis (instead of local data.json)
    let savedData = await redisClient.get('festData');
    
    let festData = savedData ? JSON.parse(savedData) : {
        overall: [
            { name: "ASKARIYYA", points: 0 },
            { name: "KUTHAIBA", points: 0 }
        ],
        categories: {
            subJunior: Array(5).fill(0).map((_, i) => ({ name: `PARTICIPANT ${i+1}`, team: "TEAM", pts: 0 })),
            junior: Array(5).fill(0).map((_, i) => ({ name: `PARTICIPANT ${i+1}`, team: "TEAM", pts: 0 })),
            senior: Array(5).fill(0).map((_, i) => ({ name: `PARTICIPANT ${i+1}`, team: "TEAM", pts: 0 }))
        }
    };

    app.use(express.static(path.join(__dirname, 'public')));

    io.on('connection', (socket) => {
        console.log('User connected via live link');
        
        // Send current data to the user who just joined
        socket.emit('initData', festData);

        // When admin saves data, update everyone and save to Redis
        socket.on('updateData', async (newData) => {
            festData = newData;
            
            // Save to Redis (This ensures data persists on Render restarts)
            await redisClient.set('festData', JSON.stringify(festData));
            
            // Broadcast to all other users
            io.emit('dataChanged', festData);
            console.log('Scores updated and saved to cloud database!');
        });
    });

    // Use process.env.PORT for Render, default to 3000 for local testing
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`-----------------------------------`);
        console.log(`SERVER RUNNING ON PORT ${PORT}`);
        console.log(`-----------------------------------`);
    });
}

startServer();
