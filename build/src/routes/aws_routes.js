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
const { getFile, getKeyList } = require('../aws/amazon_s3');
const routes = express_1.default.Router({
    mergeParams: true
});
routes.post('/get_file', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const key = req.body.key;
    console.log("Get File Called. key: " + key);
    const response = yield getFile(key);
    return res.status(200).json({ video: response });
}));
routes.post('/get_key_list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountName = req.body.user_email;
    const profileName = req.body.profile_name;
    const componentName = req.body.component_name;
    console.log("Get Key List Called. accountName: " + accountName + " profileName: " + profileName + " componentName: " + componentName);
    const response = yield getKeyList(accountName, profileName, componentName);
    return res.status(200).json({ keyList: response });
}));
module.exports = {
    routes,
};
