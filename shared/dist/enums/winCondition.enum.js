"use strict";
// The order is critical
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinCondition = void 0;
var WinCondition;
(function (WinCondition) {
    WinCondition[WinCondition["SOLO"] = 1] = "SOLO";
    WinCondition[WinCondition["STAYING_ALIVE"] = 2] = "STAYING_ALIVE";
    WinCondition[WinCondition["KILLING_EVIL"] = 3] = "KILLING_EVIL";
})(WinCondition || (exports.WinCondition = WinCondition = {}));
