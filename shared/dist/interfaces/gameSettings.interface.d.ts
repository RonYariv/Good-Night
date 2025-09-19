export interface GameSettings {
    roleCountDict: Record<string, {
        count: number;
        must: number;
    }>;
}
