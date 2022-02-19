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
const LockController_1 = require("../controllers/LockController");
const PORT = 4000;
const lock = new LockController_1.LockController();
const routes = express_1.default.Router({
    mergeParams: true
});
// Could incorporate puppeteer into VideoController. Or if puppeteer has compability issues, we use commands.
routes.post("/lock", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Hit lock route");
    let status = lock.lock();
    return res.status(200).send({ message: status });
}));
routes.post("/unlock", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Hit unlock route");
    let status = lock.unlock(req.body.lockTimeout);
    return res.status(200).send({ message: status });
}));
module.exports = {
    routes
};
