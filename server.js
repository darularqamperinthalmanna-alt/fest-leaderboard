const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Initial Data Structure - This will be the "Source of Truth"
let festData = {
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
    // Send current scores to any new device that connects
    socket.emit('initData', festData);

    // Receive new scores from Admin
    socket.on('updateData', (newData) => {
        if (newData && newData.overall) {
            festData = newData;
            // Broadcast the change to ALL connected devices immediately
            io.emit('dataChanged', festData);
            console.log("Data Updated and Broadcasted");
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
