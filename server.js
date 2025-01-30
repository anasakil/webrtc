const WebSocket = require("ws");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);
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

// Start server on your local network
const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://${getLocalIP()}:${PORT}/`);
});

// Function to get local network IP
function getLocalIP() {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const ifaceDetail of iface) {
            if (ifaceDetail.family === "IPv4" && !ifaceDetail.internal) {
                return ifaceDetail.address;
            }
        }
    }
    return "127.0.0.1";
}
