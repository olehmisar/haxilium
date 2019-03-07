import { Player } from '../models/Player';
import { ConstructorOf } from '../utils';
import { Module } from './Module';


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
    modules?: ConstructorOf<Module<TPlayer>>[],
    Player?: new (...args: any[]) => TPlayer
}
