import { NativePlayer } from '../interfaces/NativePlayer';
import { Team } from '../interfaces/Team';
import { Vector } from '../interfaces/Vector';

type PlayerSetters = {
    setPlayerAdmin(id: number, value: boolean): void,
    setPlayerTeam(id: number, value: Team): void,
}

export class Player {
    readonly id: number
    readonly name: string
    readonly position: Readonly<Vector> | null
    readonly auth: string
    readonly conn: string

    private __team!: Team
    private __admin!: boolean

    constructor(private readonly __room: PlayerSetters, { id, name, position, auth, conn, team, admin }: NativePlayer) {
        this.id = id
        this.name = name
        this.position = position
        this.auth = auth
        this.conn = conn
        Object.defineProperties(this, {
            __team: { value: team, enumerable: false, writable: true },
            __admin: { value: admin, enumerable: false, writable: true }
        })
    }

    get team() { return this.__team }
    set team(value: Team) {
        this.__team = value
        this.__room.setPlayerTeam(this.id, value)
    }

    get admin() { return this.__admin }
    set admin(value: boolean) {
        this.__admin = value
        this.__room.setPlayerAdmin(this.id, value)
    }
}
