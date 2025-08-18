import { TargetType } from "../enums/role.enum";
import { WinCondition } from "../enums/winCondition.enum";

export interface IRole {
    id: string;
    name: string;
    nightOrder: number;
    winCondition: WinCondition;
    targetTypes: TargetType[];
    maxTargets: number;
}