const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Use the environment variable you set in Step 2
const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', err => console.log('Redis Error', err));

async function startServer() {
    await redisClient.connect();
    
    // Load initial data from Redis
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
