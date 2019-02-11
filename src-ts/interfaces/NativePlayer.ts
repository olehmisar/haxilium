import { Team } from './Team';
import { Vector } from './Vector';

export interface NativePlayer {
    id: number
    name: string
    team: Team
    admin: boolean
    position: Readonly<Vector | null>
    auth: string
    conn: string
}
