import deepFreeze from 'deep-freeze';
import { NativePlayer } from './interfaces/NativePlayer';
import { RoomConfig } from './interfaces/RoomConfig';
import { Scores } from './interfaces/Scores';
import { TeamID } from './interfaces/TeamID';
import { Vector } from './interfaces/Vector';
import { Player } from './models/Player';
import { isPlayerObject } from './utils';


export abstract class DelegatedRoom {
    private room: any
    private players: { [id: number]: Player } = {}

    constructor(config: RoomConfig) {
        this.room = window.HBInit(config)
        const events = Object.keys(this).filter(key => key.startsWith('on') && key[2] === key[2].toUpperCase())
        for (const event of events) {
            this.extendNativeCallback(event)
        }
    }

    protected abstract executeCallbacks(event: string, args: any[]): void

    protected playerFilter(player: Player, opts: object) {
        if (player.id === 0) return false
        for (const [key, filterValue] of Object.entries(opts)) {
            if ((player as any)[key] === filterValue)
                return false
        }
        return true
    }

    private extendNativeCallback(event: string) {
        this.room[event] = (...args: any[]) => this.executeCallbacks(event, this.prepareCallbackArguments(args))

        Object.defineProperty(this, event, {
            set(this: DelegatedRoom, callback) {
                this.room[event] = (...args: any[]): any => {
                    callback.apply(this, args)
                    this.executeCallbacks(event, this.prepareCallbackArguments(args))
                }
            },
            get() { return this.room[event] },
            enumerable: true,
            configurable: true
        })
    }

    private prepareCallbackArguments(args: any[]): any[] {
        const newArgs = []
        for (let arg of args) {
            arg = isPlayerObject(arg)
                ? this.wrapPlayer(arg)
                : deepFreeze(arg)

            newArgs.push(arg)
        }
        return newArgs
    }

    private wrapPlayer(p: NativePlayer): Player {
        const player = this.players[p.id] || (this.players[p.id] = new Player(p))
        return Object.assign(player, p)
    }

    /*
    * Original callbacks
    */

    onPlayerJoin?: (player: Player) => void = undefined
    onPlayerLeave?: (player: Player) => void = undefined
    onTeamVictory?: (scores: Scores) => void = undefined
    onPlayerChat?: (player: Player, message: string) => false | void = undefined
    onPlayerBallKick?: (player: Player) => void = undefined
    onTeamGoal?: (team: TeamID) => void = undefined
    onGameStart?: (byPlayer: Player) => void = undefined
    onGameStop?: (byPlayer: Player | null) => void = undefined
    onPlayerAdminChange?: (player: Player, byPlayer: Player) => void = undefined
    onPlayerTeamChange?: (player: Player, byPlayer: Player) => void = undefined
    onPlayerKicked?: (player: Player, reason: string, ban: boolean, byPlayer: Player) => void = undefined
    onGameTick?: () => void = undefined
    onGamePause?: (byPlayer: Player) => void = undefined
    onGameUnpause?: (byPlayer: Player) => void = undefined
    onPositionsReset?: () => void = undefined
    onStadiumChange?: (stadiumName: string, byPlayer: Player) => void = undefined
    onRoomLink?: (url: string) => void = undefined

    /*
     * Overridden original methods
     */

    getPlayer(id: number) {
        const p = this.room.getPlayer(id)
        return p === null ? null : this.wrapPlayer(p)
    }

    getPlayerList(this: DelegatedRoom, teamsOrder: [TeamID, TeamID?, TeamID?] | object | undefined = {}, opts: object = {}) {
        if (!Array.isArray(teamsOrder)) {
            opts = teamsOrder
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
            // Get team index of returning array.
            let index = teamsOrder.indexOf(p.team)
            // If no order index is given, append team to the end.
            if (index === -1) index = teamsOrder.length
            teams[index].push(p)
        }
        return teams
    }

    /*
     * Original methods
     */

    sendChat(message: string, playerId?: number): void { return this.room.sendChat(message, playerId) }
    setPlayerAdmin(playerId: number, admin: boolean): void { return this.room.setPlayerAdmin(playerId, admin) }
    setPlayerTeam(playerId: number, team: number): void { return this.room.setPlayerTeam(playerId, team) }
    kickPlayer(playerId: number, reason: string = '', ban: boolean = false): void { return this.room.kickPlayer(playerId, reason, ban) }
    clearBan(playerId: number): void { return this.room.clearBan(playerId) }
    clearBans(): void { return this.room.clearBans() }
    setScoreLimit(limit: number): void { return this.room.setScoreLimit(limit) }
    setTimeLimit(limitInMinutes: number): void { return this.room.setTimeLimit(limitInMinutes) }
    setCustomStadium(stadiumFileContents: string): void { return this.room.setCustomStadium(stadiumFileContents) }
    setDefaultStadium(stadiumName: string): void { return this.room.setDefaultStadium(stadiumName) }
    setTeamsLock(locked: boolean): void { return this.room.setTeamsLock(locked) }
    setTeamColors(team: TeamID, angle: number, textColor: number, colors: [number, number?, number?]): void { return this.room.setTeamColors(team, angle, textColor, colors) }
    startGame(): void { return this.room.startGame() }
    stopGame(): void { return this.room.stopGame() }
    pauseGame(pause: boolean): void { return this.room.pauseGame(pause) }
    getScores(): Scores | null { return this.room.getScores() }
    getBallPosition(): Vector | null { return this.room.getBallPosition() }
    startRecording(): void { return this.room.startRecording() }
    stopRecording(): Uint8Array | null { return this.room.stopRecording() }
    setPassword(password: string): void { return this.room.setPassword(password) }
}
