import { ModuleClass } from './Module';

export interface RoomConfig {
    roomName?: string
    playerName?: string
    password?: string
    maxPlayers?: number
    public?: boolean
    geo?: {
        code?: string,
        lat?: number,
        lon?: number
    }
    token?: string,
    modules?: ModuleClass[],
}
