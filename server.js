const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configure Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => console.log('Redis Error', err));

async function startSystem() {
    await redisClient.connect();
    console.log("Connected to Redis");

    // Load initial data from Redis or use defaults
    let savedData = await redisClient.get('festData');
    let festData = savedData ? JSON.parse(savedData) : {
        overall: [
            { name: "ASKARIYYA", points: 0 },
            { name: "KUTHAIBA", points: 0 }
        ],
        categories: {
            subJunior: Array(5).fill({ name: "", team: "", pts: 0 }),
            junior: Array(5).fill({ name: "", team: "", pts: 0 }),
            senior: Array(5).fill({ name: "", team: "", pts: 0 })
        }
    };

    app.use(express.static(path.join(__dirname, 'public')));

    io.on('connection', (socket) => {
        socket.emit('initData', festData);

        socket.on('updateData', async (newData) => {
            festData = newData;
            // Save to Redis permanently so it never goes to zero
            await redisClient.set('festData', JSON.stringify(festData));
            io.emit('dataChanged', festData);
        });
    });

    const PORT = process.env.PORT || 10000;
    server.listen(PORT, () => console.log(`Server on port ${PORT}`));
}

startSystem();
