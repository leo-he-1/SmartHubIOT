"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex = require('./connection');
/*
    Use: Adds a device
    Params: device address, device name, device type, user email, profile name
*/
function addDevice(deviceAddress, deviceName, deviceType, profileId) {
    return knex("devices")
        .insert({
        device_address: deviceAddress,
        device_name: deviceName,
        device_type: deviceType,
        profile_id: profileId
    })
        .returning("*")
        .then((rows) => {
        return rows[0];
    });
}
function deleteDevice(deviceId) {
    return knex("devices")
        .where("device_id", deviceId)
        .del()
        .then((rows) => {
        return rows;
    });
}
function getDevices(profileId, deviceType) {
    return knex("devices")
        .select("device_id", "device_address", "device_name", "device_type")
        .where(function () {
        this.where("profile_id", profileId)
            .andWhere("device_type", deviceType);
    })
        .then((devices) => {
        return devices;
    });
}
function getDeviceInfo(deviceId) {
    return knex({ d: "devices" })
        .select("device_address", "profile_name", "user_email")
        .join({ p: "profiles" }, "d.profile_id", "=", "p.profile_id")
        .join({ u: "users" }, "p.user_id", "=", "u.user_id")
        .where("device_id", deviceId)
        .then((devices) => {
        return devices;
    });
}
module.exports = {
    addDevice,
    getDevices,
    getDeviceInfo,
    deleteDevice
};
