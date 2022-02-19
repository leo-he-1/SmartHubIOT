"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockController = void 0;
const Gpio = require('onoff').Gpio;
//const lock = new Gpio(17, 'out');
var lock;
var lockedTime;
class LockController {
    constructor() {
        lock = new Gpio(17, 'out');
    }
    unlock(lockTimeout) {
        //Signals unlock.
        lock.writeSync(1);
        console.log("Unlock status after first lock: ", lock.readSync());
        //If there was a lock timeout set, wait for that time then lock.
        if (lockTimeout != 0) {
            setTimeout(this.lock, Math.abs(lockTimeout) * 1000);
            return "Unlocking for " + lockTimeout + " seconds";
        }
        else {
            return "Unlocking.";
        }
    }
    lock() {
        lock.writeSync(0);
        return "Locking.";
    }
}
exports.LockController = LockController;
