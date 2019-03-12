import deepFreeze from 'deep-freeze';
import { NativePlayer } from './interfaces/NativePlayer';
import { RoomConfig } from './interfaces/RoomConfig';
import { Scores } from './interfaces/Scores';
import { Team } from './interfaces/Team';
import { Vector } from './interfaces/Vector';
import { HaxballEvents } from './models/HaxballEvents';
import { Player } from './models/Player';
import { Entries, isPlayerObject, Keys } from './utils';


export abstract class DelegatedRoom<TPlayer extends Player, TRoles extends { [role: string]: number }> extends HaxballEvents<TPlayer> {
    private room: any
    private players: { [id: number]: TPlayer } = {}
    protected Player: new (...args: any[]) => TPlayer

    constructor(config: RoomConfig<TPlayer, TRoles>) {
        super()
        this.room = window.HBInit(config)
        // TODO: remove type assertion. CRITICAL TYPE CHECK ERROR!
        this.Player = config.Player || <any>Player

        const events = Object.keys(new HaxballEvents()) as Keys<HaxballEvents<TPlayer>>
        for (const event of events) {
            this.room[event] = (...args: Parameters<HaxballEvents<TPlayer>[keyof HaxballEvents<TPlayer>]>) => {
                return this.executeCallbacks(event, this.prepareCallbackArguments(event, args))
            }
        }
    }

    /*
     * =======================
     * CALLBACKS RELATED LOGIC
     * =======================
     */

    protected abstract executeCallbacks(event: string, args: any[]): void

    /**
     * Replace native players with `Player` wrappers.
     */
    private prepareCallbackArguments<E extends keyof HaxballEvents<TPlayer>>(event: E, args: Parameters<HaxballEvents<TPlayer>[E]>): typeof args {
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

    getPlayer(id: number): TPlayer | null {
        const p: NativePlayer = this.room.getPlayer(id)
        return p === null ? null : this.wrapPlayer(p)
    }

    getPlayerList(opts?: object): TPlayer[]
    getPlayerList(teamsOrder: [Team],        /**/ opts?: Partial<TPlayer>): [TPlayer[]]
    getPlayerList(teamsOrder: [Team, Team],  /**/ opts?: Partial<TPlayer>): [TPlayer[], TPlayer[]]
    getPlayerList(teamsOrder: [Team, Team, Team], opts?: Partial<TPlayer>): [TPlayer[], TPlayer[], TPlayer[]]
    getPlayerList(teamsOrder?: [Team, Team?, Team?] | typeof opts, opts: Partial<TPlayer> = {}): TPlayer[] | TPlayer[][] {
        if (!Array.isArray(teamsOrder)) {
            opts = teamsOrder || {}
            teamsOrder = undefined
        }

        const players: TPlayer[] = []
        const nativePlayers: NativePlayer[] = this.room.getPlayerList()
        for (let i = 0, j = 0; i < nativePlayers.length; i++) {
            const p = this.wrapPlayer(nativePlayers[i])
            if (this.playerFilter(p, opts))
                players[j++] = p
        }

        // Return just array of players.
        if (typeof teamsOrder === 'undefined') return players

        // Return array of teams.
        const teams: [TPlayer[], TPlayer[], TPlayer[]] = [[], [], []]
        for (let i = 0; i < players.length; i++) {
            const p = players[i]
            const index = teamsOrder.indexOf(p.team)
            if (index !== -1) {
                teams[index].push(p)
            }
        }
        return teams
    }

    private playerFilter(player: TPlayer, opts: Partial<TPlayer>): boolean {
        if (player.id === 0) return false
        for (const [key, filterValue] of <Entries<typeof opts>>Object.entries(opts)) {
            if (player[key] === filterValue)
                return false
        }
        return true
    }

    private wrapPlayer(p: NativePlayer, event?: keyof HaxballEvents<TPlayer>): TPlayer {
        const player = this.players[p.id] || (this.players[p.id] = new this.Player(this.room, p))

        const changedProps: Pick<NativePlayer, 'position'> & {
            __team?: NativePlayer['team'],
            __admin?: NativePlayer['admin']
        } = { position: p.position }

        if (event === 'onPlayerTeamChange') changedProps.__team = p.team
        else if (event === 'onPlayerAdminChange') changedProps.__admin = p.admin

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
