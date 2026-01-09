const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// IMPORTANT: This tells the server to look INSIDE the 'public' folder for your website
app.use(express.static(path.join(__dirname, 'public')));

// Default Data
let festData = {
    overall: [
        { name: "ASKARIYYA", points: 0 },
        { name: "KUTHAIBA", points: 0 }
    ],
    categories: {
        subJunior: Array(5).fill(0).map((_, i) => ({ name: `Participant ${i+1}`, team: "TEAM", pts: 0 })),
        junior: Array(5).fill(0).map((_, i) => ({ name: `Participant ${i+1}`, team: "TEAM", pts: 0 })),
        senior: Array(5).fill(0).map((_, i) => ({ name: `Participant ${i+1}`, team: "TEAM", pts: 0 }))
    }
};

io.on('connection', (socket) => {
    socket.emit('initData', festData);
    socket.on('updateData', (newData) => {
        festData = newData;
        io.emit('dataChanged', festData);
    });
});

// Use Render's port or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
