// The order is critical
export var WinCondition;
(function (WinCondition) {
    WinCondition[WinCondition["SOLO"] = 1] = "SOLO";
    WinCondition[WinCondition["STAYING_ALIVE"] = 2] = "STAYING_ALIVE";
    WinCondition[WinCondition["KILLING_EVIL"] = 3] = "KILLING_EVIL";
})(WinCondition || (WinCondition = {}));
