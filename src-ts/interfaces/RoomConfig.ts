import { Player } from '../models/Player';
import { ConstructorOf } from '../utils';


export interface RoomConfig<TPlayer extends Player> {
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
    modules?: ConstructorOf<object>[],
    Player?: ConstructorOf<TPlayer>,
}
