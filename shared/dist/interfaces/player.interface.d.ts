import { IRole } from "./role.interface";
export interface IPlayerRoleHistoryItem {
    roleId: string;
    assignedAt: number;
}
export interface IPlayer {
    id: string;
    name: string;
    currentRole: IRole | null;
    roleHistory: IPlayerRoleHistoryItem[] | null;
}
