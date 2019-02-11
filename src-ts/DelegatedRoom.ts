import deepFreeze from 'deep-freeze';
import { HaxballEvents, HaxballEventsClass } from './HaxballEvents';
import { NativePlayer } from './interfaces/NativePlayer';
import { RoomConfig } from './interfaces/RoomConfig';
import { Scores } from './interfaces/Scores';
import { Team } from './interfaces/Team';
import { Vector } from './interfaces/Vector';
import { Player } from './models/Player';
import { Entries, FilterOptions, isPlayerObject, Keys } from './utils';


export abstract class DelegatedRoom extends HaxballEventsClass {
    private room: any
    private players: { [id: number]: Player } = {}

    constructor(config: RoomConfig) {
        super()
        this.room = window.HBInit(config)

        const events = <Keys<HaxballEvents>>Object.keys(new HaxballEventsClass())
        for (const event of events) {
            this.room[event] = (...args: Parameters<HaxballEvents[keyof HaxballEvents]>) => {
                this.executeCallbacks(event, this.prepareCallbackArguments(event, args))
            }
        }
    }

    /*
     * =======================
     * CALLBACKS RELATED LOGIC
     * =======================
     */

    protected abstract executeCallbacks<E extends keyof HaxballEvents>(event: E, args: Parameters<HaxballEvents[E]>): void

    /**
     * Replace native players with `Player` wrappers.
     */
    private prepareCallbackArguments<E extends keyof HaxballEvents>(event: E, args: Parameters<HaxballEvents[E]>): typeof args {
        // TODO: make `args: ReplacePlayerWithNativePlayer<Parameters<HaxballEvents[keyof HaxballEvents]>>`

        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            args[i] = isPlayerObject(arg)
                ? this.wrapPlayer(arg, event)
                // TODO: Replace runtime freeze with compile time checks.
                : deepFreeze(arg)
        }
        return args
    }

    /*
     * =====================
     * PLAYERS RELATED LOGIC
     * =====================
     */

    getPlayer(id: number) {
        const p: NativePlayer = this.room.getPlayer(id)
        return p === null ? null : this.wrapPlayer(p)
    }

    getPlayerList(opts?: object): Player[]
    getPlayerList(teamsOrder: [Team],        /**/ opts?: FilterOptions<Player>): [Player[]]
    getPlayerList(teamsOrder: [Team, Team],  /**/ opts?: FilterOptions<Player>): [Player[], Player[]]
    getPlayerList(teamsOrder: [Team, Team, Team], opts?: FilterOptions<Player>): [Player[], Player[], Player[]]
    getPlayerList(teamsOrder?: [Team, Team?, Team?] | typeof opts, opts: FilterOptions<Player> = {}): Player[] | Player[][] {
        if (!Array.isArray(teamsOrder)) {
            opts = teamsOrder || {}
            teamsOrder = undefined
        }

        const players: Player[] = []
        for (let p of this.room.getPlayerList()) {
            p = this.wrapPlayer(p)
            if (this.playerFilter(p, opts))
                players.push(p)
        }

        // Return just array of players.
        if (typeof teamsOrder === 'undefined') return players

        // Return array of teams.
        const teams: [Player[], Player[], Player[]] = [[], [], []]
        for (let p of players) {
            // Get team index.
            let index = teamsOrder.indexOf(p.team)
            // If no order index is given, append team to the end.
            if (index === -1) index = teamsOrder.length
            teams[index].push(p)
        }
        return teams
    }

    private playerFilter(player: Player, opts: FilterOptions<Player>): boolean {
        if (player.id === 0) return false
        for (const [key, filterValue] of <Entries<typeof opts>>Object.entries(opts)) {
            if (player[key] === filterValue)
                return false
        }
        return true
    }

    private wrapPlayer(p: NativePlayer, event?: keyof HaxballEvents): Player {
        const player = this.players[p.id] || (this.players[p.id] = new Player(this.room, p))

        const changedProps: Pick<NativePlayer, 'position'> & {
            _team?: NativePlayer['team'],
            _admin?: NativePlayer['admin']
        } = { position: p.position }

        if (event === 'onPlayerTeamChange') changedProps._team = p.team
        else if (event === 'onPlayerAdminChange') changedProps._admin = p.admin

        return Object.assign(player, changedProps)
    }

    /*
     * =================
     * DELEGATED METHODS
     * =================
     */

    sendChat(message: string, playerId?: number): void { return this.room.sendChat(message, playerId) }
    setPlayerAdmin(playerId: number, admin: boolean): void { return this.room.setPlayerAdmin(playerId, admin) }
    setPlayerTeam(playerId: number, team: Team): void { return this.room.setPlayerTeam(playerId, team) }
    kickPlayer(playerId: number, reason: string = '', ban: boolean = false): void { return this.room.kickPlayer(playerId, reason, ban) }
    clearBan(playerId: number): void { return this.room.clearBan(playerId) }
    clearBans(): void { return this.room.clearBans() }
    setScoreLimit(limit: number): void { return this.room.setScoreLimit(limit) }
    setTimeLimit(limitInMinutes: number): void { return this.room.setTimeLimit(limitInMinutes) }
    setCustomStadium(stadiumFileContents: string): void { return this.room.setCustomStadium(stadiumFileContents) }
    setDefaultStadium(stadiumName: string): void { return this.room.setDefaultStadium(stadiumName) }
    setTeamsLock(locked: boolean): void { return this.room.setTeamsLock(locked) }
    setTeamColors(team: Team, angle: number, textColor: number, colors: [number, number?, number?]): void { return this.room.setTeamColors(team, angle, textColor, colors) }
    startGame(): void { return this.room.startGame() }
    stopGame(): void { return this.room.stopGame() }
    pauseGame(pause: boolean): void { return this.room.pauseGame(pause) }
    getScores(): Scores | null { return this.room.getScores() }
    getBallPosition(): Vector | null { return this.room.getBallPosition() }
    startRecording(): void { return this.room.startRecording() }
    stopRecording(): Uint8Array | null { return this.room.stopRecording() }
    setPassword(password: string): void { return this.room.setPassword(password) }
}
