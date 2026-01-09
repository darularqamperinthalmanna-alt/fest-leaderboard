const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect using the Environment Variable you just added
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => console.log('Database Error:', err));

async function startServer() {
    await redisClient.connect();
    console.log("Connected to fest-db");

    let savedData = await redisClient.get('festData');
    let festData = savedData ? JSON.parse(savedData) : {
        overall: [
            { name: "ASKARIYYA", points: 0 },
            { name: "KUTHAIBA", points: 0 }
        ],
        categories: { subJunior: [], junior: [], senior: [] }
    };

    app.use(express.static(path.join(__dirname, 'public')));

    io.on('connection', (socket) => {
        socket.emit('initData', festData);
        socket.on('updateData', async (newData) => {
            festData = newData;
            // Save to Redis so scores never reset to zero
            await redisClient.set('festData', JSON.stringify(festData));
            io.emit('dataChanged', festData);
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
