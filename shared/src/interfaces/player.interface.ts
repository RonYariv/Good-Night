import { IRole } from "./role.interface";
  
  export interface IPlayer {
    id: string;
    name: string;
    currentRole: IRole | null;
    roleHistory: IRole[] | null;
  }
  