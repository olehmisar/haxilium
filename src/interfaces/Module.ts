import { HaxballEvents } from '../models/HaxballEvents';
import { Player } from '../models/Player';


export interface Module<TPlayer extends Player> extends Partial<HaxballEvents<TPlayer>> {
    [id: string]: unknown
}
