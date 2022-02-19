"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioController = void 0;
const io = require("socket.io");
/*



*/
class AudioController {
    constructor() {
        this.namespace = null;
        this.audioOrigin = "";
    }
    // Attach an http server to the socket.io server.
    setNameSpace(server) {
        this.namespace = server.of('/audio');
        // Setup server side socket events and bind this instance to the function for access in socket namespace.
        this.namespace.on("connection", this.handleEvents.bind(this));
    }
    // Handler for all socket events. Calls their appropriate methods.
    // **** NOTE: Everything is in the scope of the socket. ****
    handleEvents(socket) {
        socket.on("audio_origin", () => {
            this.handleOrigin(socket);
        });
        socket.on("audio_join", () => {
            this.handleJoin(socket);
        });
        socket.on("offer", (id, message) => {
            this.handleOffer(socket, id, message);
        });
        socket.on("answer", (id, message) => {
            this.handleAnswer(socket, id, message);
        });
        socket.on("candidate", (id, message) => {
            this.handleCandidate(socket, id, message);
        });
        socket.on("disconnect", () => {
            this.handleDisconnect(socket);
        });
    }
    handleOrigin(socket) {
        this.audioOrigin = socket.id;
        socket.broadcast.emit("audio_origin");
    }
    handleJoin(socket) {
        socket.to(this.audioOrigin).emit("audio_join", socket.id);
    }
    handleOffer(socket, id, message) {
        socket.to(id).emit("offer", socket.id, message);
    }
    handleAnswer(socket, id, message) {
        socket.to(id).emit("answer", socket.id, message);
    }
    handleCandidate(socket, id, message) {
        socket.to(id).emit("candidate", socket.id, message);
    }
    handleDisconnect(socket) {
        socket.to(this.audioOrigin).emit("disconnectPeer", socket.id);
    }
}
exports.AudioController = AudioController;
