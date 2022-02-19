"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const fs_1 = __importDefault(require("fs"));
var AWS = require('aws-sdk');
require('dotenv').config();
const dotenv = __importStar(require("dotenv"));
const path = './.env';
dotenv.config({ path });
const envVars = process.env;
//credential validation
try {
    AWS.config.setPromisesDependency();
    AWS.config.update({
        accessKeyId: envVars.AWS_ACCESS_KEY_ID,
        secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
        region: envVars.AWS_DEFAULT_REGION
    });
}
catch (e) {
    console.log('Error: ' + e);
}
//s3 object to interact with physical s3 on aws
const s3 = new AWS.S3({ signatureVersion: 'v4' });
//userEmail is a folder and profileName is a subFolder in userEmail, the last param is either the images or video folder
module.exports.createFolder = function (accountName, profileName, componentName) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield s3.putObject({
            Bucket: envVars.S3_BUCKET,
            Key: (accountName + "/" + profileName + "/" + componentName + "/").replace(/\s/g, "_"),
        }).promise();
        console.log("Folder creation was successful");
        return response;
    });
};
module.exports.uploadVideo = function (accountName, profileName, componentName, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileContent = fs_1.default.readFileSync(filePath);
        const params = {
            Bucket: envVars.S3_BUCKET,
            Key: (accountName + "/" + profileName + "/" + componentName + "/" + "vid_" + new Date()).replace(/\s/g, "_"),
            Body: fileContent,
            ContentType: "video/webm"
        };
        const response = yield s3.upload(params).promise();
        console.log("File Upload Complete.");
        return response;
    });
};
module.exports.uploadImage = function (accountName, profileName, componentName, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileContent = fs_1.default.readFileSync(filePath);
        const params = {
            Bucket: envVars.S3_BUCKET,
            Key: (accountName + "/" + profileName + "/" + componentName + "/" + "img_" + new Date()).replace(/\s/g, "_"),
            Body: fileContent,
            ContentType: "image/png"
        };
        const response = yield s3.upload(params).promise();
        console.log("File Upload Complete.");
        return response;
    });
};
function getFile(key) {
    return __awaiter(this, void 0, void 0, function* () {
        key = key.replace(/\s/g, "_");
        const signedUrlExpireSeconds = 60 * 10080;
        const params = {
            Bucket: envVars.S3_BUCKET,
            Key: key,
            Expires: signedUrlExpireSeconds
        };
        const response = yield s3.getSignedUrl('getObject', params);
        return response;
    });
}
module.exports.getKeyList = function (accountName, profileName, componentName) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = (accountName + "/" + profileName + "/" + componentName + "/").replace(/\s/g, "_");
        const params = {
            Bucket: envVars.S3_BUCKET,
            Prefix: key,
            ContinuationToken: null
        };
        var allKeys = [];
        function listAllKeys() {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield s3.listObjectsV2(params).promise();
                var contents = response.Contents;
                for (var i = 1; i < contents.length; i++) {
                    allKeys.push(contents[i].Key);
                }
                if (response.NextContinuationToken) {
                    params.ContinuationToken = response.NextContinuationToken;
                    yield listAllKeys(); // RECURSIVE CALL
                }
            });
        }
        yield listAllKeys();
        var keyUrlPairs = [];
        for (var i = 0; i < allKeys.length; i++) {
            var newPair = {};
            newPair["key"] = allKeys[i];
            newPair["url"] = yield getFile(allKeys[i]);
            keyUrlPairs[i] = newPair;
        }
        return keyUrlPairs;
    });
};
