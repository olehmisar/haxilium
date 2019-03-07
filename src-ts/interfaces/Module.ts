import { HaxballEvents } from '../HaxballEvents';
import { Player } from '../models/Player';

export interface Module<TPlayer extends Player> extends Partial<HaxballEvents<TPlayer>> {
    [key: string]: any
}
