"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server = express_1.default();
const PORT = 3000;
server.get("/", (req, res) => {
    res.send("Hello world!");
});
// serverApp.post('/video', (req, res) => {
//
// });
server.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
});
