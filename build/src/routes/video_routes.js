"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const VideoController_1 = require("../controllers/VideoController");
const { createFolder, uploadVideo, uploadImage } = require('../aws/amazon_s3');
let live_browser;
let browserIsLive = false;
const PORT = 4000;
const OSplatform = process.platform;
const localStoragePath = path_1.default.resolve(__dirname, "./output/output.webm");
const imageLocalStoragePath = path_1.default.resolve(__dirname, "./output/output.png");
const controller = new VideoController_1.VideoController();
const routes = express_1.default.Router({
    mergeParams: true
});
/*
    Use: Stops the video stream on the pi.
    Params: none
*/
routes.post("/stop_stream", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("stop_stream route: Stream closing...");
    try {
        yield live_browser.close();
    }
    catch (error) {
        console.log("stop_stream route error: " + error);
    }
    finally {
        yield live_browser.close();
    }
    console.log("stop_stream route: Stream stopped.");
    return res.status(200).send("Stream Closing.");
}));
/*
    Use: Starts the video stream on the pi.
    Params: none
*/
routes.post("/start_stream", (req, res) => {
    console.log("start_stream route: Stream starting...");
    runLive();
    console.log("start_stream route: Stream started.");
    return res.status(200).send("Stream Starting.");
});
/*
    Use: Starts recording on the video stream.
    Params: none
*/
routes.post('/start_recording', (req, res) => {
    controller.startRecording();
    console.log("start_recording route: recording starting...");
    return res.status(200).send("Recording Starting.");
});
/*
    Use: Stops recording and upload file to S3.
    Params: user_email, profile_name, component_name.
*/
routes.post('/stop_recording', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountName = req.body.user_email;
    const profileName = req.body.profile_name;
    const componentName = req.body.component_name;
    controller.stopRecording();
    console.log("stop_recording route: Creating folder...");
    yield createFolder(accountName, profileName, componentName);
    console.log("stop_recording route: Starting upload to " + localStoragePath);
    yield uploadVideo(accountName, profileName, componentName, localStoragePath);
    console.log("stop_recording route: recording stopping...");
    if (OSplatform === 'win32') {
        child_process_1.exec('del ' + localStoragePath);
    }
    else {
        child_process_1.exec('rm ' + localStoragePath);
    }
    console.log("stop_recording_route: cleaned local storage.");
    return res.status(200).send("Recording Stopping.");
}));
/*
    Use: Takes a picture of the current video stream, then saves it to a file.
    Params: user_email, profile_name, component_name.
*/
routes.post('/take_image', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountName = req.body.user_email;
    const profileName = req.body.profile_name;
    const componentName = req.body.component_name;
    controller.takingPicture();
    yield createFolder(accountName, profileName, componentName);
    console.log("take_image route: Starting upload to " + imageLocalStoragePath);
    yield uploadImage(accountName, profileName, componentName, imageLocalStoragePath);
    console.log("take_image route: image taken...");
    if (OSplatform === 'win32') {
        child_process_1.exec('del ' + imageLocalStoragePath);
    }
    else {
        child_process_1.exec('rm ' + imageLocalStoragePath);
    }
    console.log("take_image route: cleaned local storage.");
    return res.status(200).send("Images saved.");
}));
/*
    Use: Starts the headless chromium browser to utilize WebRTC.
    Params: none
*/
function runLive() {
    return __awaiter(this, void 0, void 0, function* () {
        // For now some safety to avoid multiple browser processes open.
        if (!browserIsLive) {
            // The boolean might be slow to update, but front-end can also control access to the route.
            browserIsLive = true;
            // Launch the chromium browser in headless mode.
            live_browser = yield puppeteer_core_1.default.launch({
                executablePath: 'chromium-browser',
                headless: true,
                args: ['--use-fake-ui-for-media-stream', '--mute-audio']
            });
            // Create a new page in the browser.
            const page = yield live_browser.newPage();
            yield page.goto("http://localhost:" + PORT + "/broadcast.html");
            console.log("Chromium is live.");
            live_browser._process.once('close', () => {
                console.log("Browser has closed.");
                browserIsLive = false;
            });
        }
    });
}
module.exports = {
    routes,
    controller
};
