import { RoomConfig } from './interfaces/RoomConfig';
import { Player } from './models/Player';
import { Room } from './Room';


export default function haxilium<TPlayer extends Player>(config: RoomConfig<TPlayer>) {
    return new Room(config)
}

export { Event } from './decorators/Event';
export { Module } from './decorators/Module';
export { Scores } from './interfaces/Scores';
export { Team } from './interfaces/Team';
export { Vector } from './interfaces/Vector';
export { HaxballEventsInterface as HaxballEvents } from './models/HaxballEvents';
export { Player } from './models/Player';
export { Room } from './Room';
