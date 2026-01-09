const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = path.join(__dirname, 'festData.json');

// --- DATA PERSISTENCE LOGIC ---
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Error reading data file, using defaults.");
    }
    // Default data structure if no file exists
    return {
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
}

let festData = loadData();

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('initData', festData);

    socket.on('updateData', (newData) => {
        festData = newData;
        // Save to hard drive immediately
        fs.writeFileSync(DATA_FILE, JSON.stringify(festData, null, 2));
        // Broadcast to everyone else
        io.emit('dataChanged', festData);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
