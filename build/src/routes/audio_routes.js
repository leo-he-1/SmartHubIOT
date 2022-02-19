"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AudioController_1 = require("../controllers/AudioController");
const routes = express_1.default.Router({
    mergeParams: true
});
const controller = new AudioController_1.AudioController();
module.exports = {
    routes,
    controller
};
