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
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const createFolder = require('../aws/amazon_s3').createFolder;
let live_browser;
let recording_browser;
let browserIsLive = false;
const PORT = 4000;
const routes = express_1.default.Router({
    mergeParams: true
});
// Could incorporate puppeteer into VideoController. Or if puppeteer has compability issues, we use commands.
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
    return res.status(200).json({ message: "stop_stream route: Stream stopped." });
}));
routes.post("/start_stream", (req, res) => {
    console.log("start_stream route: Stream starting...");
    runLive();
    console.log("start_stream route: Stream started.");
    return res.status(200).json({ message: "start_stream route: Stream started." });
});





//-----------------------------------------s3---------------------------------------
//Below will create two folders a users folder (account) and sub folder(s) (profiles)
routes.post("/createS3Folder", (req, res) => {
    createFolder(req.body.userName, req.body.profileName);
});
//--------------------------------------------------------------------------------
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
            //WARNING, THIS IS HARD CODED AND IT SHOULDNT BE!, PUT STUFF LIKE PORT IN AN ENVIRONMENT VARIABLE OR SOMETHING SO IT CAN BE UPDATED EVERYWHERE IF ITS CHANGED.
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
    routes
};
