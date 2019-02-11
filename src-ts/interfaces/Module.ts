import { HaxballEvents } from '../HaxballEvents';
import { Room } from '../Room';

export type ModuleParameter = Room | Module
export interface Module extends Partial<HaxballEvents> {
    new?(...args: any[]): Module
}

export type ModuleClass = {
    new(...args: any[]): Module
}

export type PossibleModuleParameter = ModuleClass
    | typeof Room
    | typeof Number
    | typeof String
    | typeof Boolean
    | typeof Object
    | typeof Array
    | typeof Function
    | undefined
