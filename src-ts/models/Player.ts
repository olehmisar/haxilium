import { NativePlayer } from '../interfaces/NativePlayer';
import { TeamID } from '../interfaces/TeamID';
import { Vector } from '../interfaces/Vector';

export class Player {
    readonly id: number
    readonly name: string
    admin: boolean
    team: TeamID
    readonly position: Vector | null
    readonly auth: string
    readonly conn: string

    constructor({ id, name, position, auth, conn, team, admin }: NativePlayer) {
        this.id = id
        this.name = name
        this.admin = admin
        this.team = team
        this.position = position
        this.auth = auth
        this.conn = conn
    }
}
