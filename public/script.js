const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCallButton = document.getElementById("startCall");
const hangUpButton = document.getElementById("hangUp");

let localStream;
let peerConnection;

// Create WebSocket connection
const socket = new WebSocket('wss://webrtc-1ch8.onrender.com:3000');

// Wait for the WebSocket connection to be established before sending any messages
socket.addEventListener('open', () => {
    console.log('WebSocket connection established');
});

// WebRTC Configuration with STUN Server
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Handle incoming WebSocket messages
socket.onmessage = async (event) => {
    if (event.data instanceof Blob) {
        event.data.text().then(text => handleMessage(JSON.parse(text)));
    } else {
        handleMessage(JSON.parse(event.data));
    }
};

// Handle messages (Offer, Answer, ICE Candidates)
async function handleMessage(message) {
    if (!peerConnection) createPeerConnection();

    if (message.type === "offer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: "answer", answer }));
    } else if (message.type === "answer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.type === "ice-candidate") {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
            .catch(e => console.error("Error adding ICE candidate", e));
    }
}

// Create and configure Peer Connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
            } else {
                socket.addEventListener('open', () => {
                    socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
                });
            }
        }
    };

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };
}

// Start the video call
async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    createPeerConnection();
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: "offer", offer }));
}

// Hang up the call
function hangUp() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

// Event listeners
startCallButton.addEventListener("click", startCall);
hangUpButton.addEventListener("click", hangUp);
