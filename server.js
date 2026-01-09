const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const DATA_FILE = path.join(__dirname, 'data.json');

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

// Load existing data if it exists
if (fs.existsSync(DATA_FILE)) {
    try {
        festData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) { console.log("Error reading data file"); }
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    socket.emit('initData', festData);

    socket.on('updateData', (newData) => {
        festData = newData;
        fs.writeFileSync(DATA_FILE, JSON.stringify(festData));
        io.emit('dataChanged', festData);
    });
});

// IMPORTANT: process.env.PORT is required for Render/Cloud
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server live on port ${PORT}`);
});
