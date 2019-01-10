import { TeamID } from './TeamID';
import { Vector } from './Vector';

export interface NativePlayer {
    id: number
    name: string
    team: TeamID
    admin: boolean
    position: Vector | null
    auth: string
    conn: string
}
