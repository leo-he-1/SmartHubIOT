"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http = require("http");
const body_parser_1 = __importDefault(require("body-parser"));
const { routes: videoRoutes, controller: videoController } = require('./routes/video_routes');
const { routes: audioRoutes, controller: audioController } = require('./routes/audio_routes');
//const { routes: lockRoutes } = require('./routes/lock_routes');
const { routes: profileRoutes } = require('./routes/profile_routes');
const { routes: deviceRoutes } = require('./routes/device_routes');
const { routes: awsRoutes } = require('./routes/aws_routes');
const app = express_1.default();
// Express built-in middleware function static allows serving static files.
app.use(express_1.default.static('public'));
app.use(body_parser_1.default.urlencoded({
    extended: true
}));
// Ensure incoming data has json format.
app.use(body_parser_1.default.json());
//Allows any address to interact with our server
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// Create a http server object from the express application.
const httpServer = http.createServer(app);
const io = require("socket.io")(httpServer);
const PORT = 4000;
videoController.setNameSpace(io);
audioController.setNameSpace(io);
//Telling express to use the routes found in /video/video_routes.ts (Access these routes by http using /video/startStream, /video/startRecord etc...)
app.use('/video', videoRoutes);
app.use('/profiles', profileRoutes);
app.use('/devices', deviceRoutes);
//app.use('/lock', lockRoutes);
app.use('/aws', awsRoutes);
httpServer.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
});
