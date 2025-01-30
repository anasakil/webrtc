const WebSocket = require("ws");
const express = require("express");

const app = express();

// Create an HTTP server
const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

// Create a WebSocket server that uses the same server instance
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", (socket) => {
    console.log("New client connected.");
    clients.push(socket);

    socket.on("message", (message) => {
        console.log("Received:", message);
        clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    socket.on("close", () => {
        clients = clients.filter(client => client !== socket);
        console.log("Client disconnected.");
    });
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname + "/public"));
