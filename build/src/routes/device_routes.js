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
const Devices = require('../db/devices');
const { getProfileID } = require('../db/profiles');
const routes = express_1.default.Router({
    mergeParams: true
});
/*
    Use: Adds a device
    Params: device address, device name, device type, profile_id
*/
routes.post("/addDevice", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    Devices.addDevice(req.body.device_address, req.body.device_name, req.body.device_type, req.body.profile_id).then((device) => {
        if (device) {
            return res.status(200).json(device);
        }
        else {
            return res.status(500).json({ message: "Unable to insert device." });
        }
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ message: err });
    });
}));
routes.post("/deleteDevice", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    Devices.deleteDevice(req.body.device_id).then((device) => {
        //If the insertion was a success, respond with the device data that was inserted.
        if (device) {
            return res.status(200).json({ message: "Device deleted." });
        }
        else {
            return res.status(500).json({ message: "Device does not exist(?). Unable to delete device." });
        }
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ message: err });
    });
}));
routes.post("/getDevices", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    Devices.getDevices(req.body.profile_id, req.body.device_type).then((devices) => {
        if (devices) {
            res.status(200).json({ devices });
        }
        else {
            return res.status(500).json({ message: "Unable to get device." });
        }
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ message: err });
    });
    ;
}));
routes.post("/getDeviceInfo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    Devices.getDeviceInfo(req.body.device_id).then((device) => {
        if (device) {
            res.status(200).json({ device });
        }
        else {
            return res.status(500).json({ message: "Unable to get device." });
        }
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ message: err });
    });
    ;
}));
module.exports = {
    routes
};
