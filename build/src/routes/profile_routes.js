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
const Profiles = require('../db/profiles');
const routes = express_1.default.Router({
    mergeParams: true
});
/*
    Use: Adds a profile.
    Params: users email, profile name
*/
routes.post("/addProfile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    Profiles.addProfile(req.body.user_id, req.body.profile_name).then((profile) => {
        //If the insertion was a success, respond with the profile data that was inserted.
        if (profile) {
            return res.status(200).json(profile);
        }
        else {
            return res.status(500).json({ message: "Unable to insert profile." });
        }
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ message: err });
    });
}));
/*
    Use: Returns all profiles belonging to a user.
    Params: users email
*/
routes.post("/getProfiles", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    Profiles.getProfiles(req.body.user_id).then((profiles) => {
        if (profiles.length != 0) {
            res.status(200).json({ profiles });
        }
        else {
            return res.status(500).json({ message: "No profiles found." });
        }
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ message: err });
    });
    ;
}));
/*
    Use: Returns a profile id belonging to a profile.
    Params: users email, profile name
    --below is not needed for profiles
*/
// routes.post("/getProfileID", async (req, res) => {
// 	Profiles.getProfileID(req.body.user_email, req.body.profile_name).then((profile:any) => {
//         console.log(profile)
//         if(profile) {
//             res.status(200).json({profile});
//         }
//         else {
//             return res.status(500).json({message: "No profile found."});
//         }
//     }).catch((err: any) => {
//         console.log(err);
//         return res.status(500).json({message: err});
//     });;
// });
/*
    Use: Deletes a profile.
    Params: profile_id
*/
routes.post("/deleteProfile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    Profiles.deleteProfile(req.body.profile_id).then((profile) => {
        //If the insertion was a success, respond with the profile data that was inserted.
        if (profile) {
            return res.status(200).json({ message: "Profile deleted." });
        }
        else {
            return res.status(500).json({ message: "Profile does not exist(?). Unable to delete profile." });
        }
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ message: err });
    });
}));
module.exports = {
    routes
};
