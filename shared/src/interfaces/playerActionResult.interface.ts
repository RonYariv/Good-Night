import { IRole } from "./role.interface";

export interface PlayerActionResult {
  gameCode: string;
  playerId: string;
  action: string;
  info: {
    seenRoles?: IRole[];
    swappedRole?: IRole | null;
  };
}