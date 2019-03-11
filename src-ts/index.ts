import { RoomConfig } from './interfaces/RoomConfig';
import { HaxballEvents as HaxballEventsClass } from './models/HaxballEvents';
import { Player } from './models/Player';
import { Room } from './Room';


export default function haxilium<TPlayer extends Player>(config: RoomConfig<TPlayer>) {
    return new Room(config)
}

export interface HaxballEvents<TPlayer extends Player> extends Partial<HaxballEventsClass<TPlayer>> { }

export { CommandDecorator as Command } from './decorators/CommandDecorator';
export { EventDecorator as Event } from './decorators/EventDecorator';
export { ModuleDecorator as Module } from './decorators/ModuleDecorator';
export { UnknownCommandError } from './errors';
export { Scores } from './interfaces/Scores';
export { Team } from './interfaces/Team';
export { Vector } from './interfaces/Vector';
export { Player } from './models/Player';
export { Room } from './Room';
