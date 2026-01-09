const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = './data.json';

// Initial data if file doesn't exist
let festData = {
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

// Load existing data from file if it exists
if (fs.existsSync(DATA_FILE)) {
    festData = JSON.parse(fs.readFileSync(DATA_FILE));
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('User connected via live link');
    
    // Send current data to the user who just joined
    socket.emit('initData', festData);

    // When admin saves data, update everyone
    socket.on('updateData', (newData) => {
        festData = newData;
        // Save to file so scores aren't lost if PC restarts
        fs.writeFileSync(DATA_FILE, JSON.stringify(festData));
        // Broadcast to all other users
        io.emit('dataChanged', festData);
        console.log('Scores updated and broadcasted!');
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------`);
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
    console.log(`-----------------------------------`);
});