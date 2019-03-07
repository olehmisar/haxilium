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

    // TODO: rename _team and _admin to __team and __admin
    private _team!: Team
    private _admin!: boolean

    constructor(private readonly room: PlayerSetters, { id, name, position, auth, conn, team, admin }: NativePlayer) {
        this.id = id
        this.name = name
        this.position = position
        this.auth = auth
        this.conn = conn
        Object.defineProperties(this, {
            _team: { value: team, enumerable: false, writable: true },
            _admin: { value: admin, enumerable: false, writable: true }
        })
    }

    get team() { return this._team }
    set team(value: Team) {
        this._team = value
        this.room.setPlayerTeam(this.id, value)
    }

    get admin() { return this._admin }
    set admin(value: boolean) {
        this._admin = value
        this.room.setPlayerAdmin(this.id, value)
    }
}
