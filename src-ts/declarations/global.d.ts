import { RoomConfig } from '../interfaces/RoomConfig';
import { Scores } from '../interfaces/Scores';
import { TeamID } from '../interfaces/TeamID';
import { Vector } from '../interfaces/Vector';
import { Player } from '../models/Player';


declare global {
    interface Window {
        HBInit: typeof HBInit
        onHBLoaded(): void
    }
}

declare class HBInit {
    constructor(config: RoomConfig)


    sendChat(message: string, playerId?: number): void
    setPlayerAdmin(playerId: number, admin: boolean): void
    setPlayerTeam(playerId: number, team: number): void
    kickPlayer(playerId: number, reason: string, ban: boolean): void
    clearBan(playerId: number): void
    clearBans(): void
    setScoreLimit(limit: number): void
    setTimeLimit(limitInMinutes: number): void
    setCustomStadium(stadiumFileContents: string): void
    setDefaultStadium(stadiumName: string): void
    setTeamsLock(locked: boolean): void
    setTeamColors(team: TeamID, angle: number, textColor: number, colors: [number, number?, number?]): void
    startGame(): void
    stopGame(): void
    pauseGame(pause: boolean): void
    getPlayer(playerId: number): Player
    getPlayerList(): Player[]
    getScores(): Scores
    getBallPosition(): Vector
    startRecording(): void
    stopRecording(): Uint8Array
    setPassword(pass: string): void


    onPlayerJoin(player: Player): void
    onPlayerLeave(player: Player): void
    onTeamVictory(scores: Scores): void
    onPlayerChat(player: Player, message: string): void | false
    onPlayerBallKick(player: Player): void
    onTeamGoal(team: TeamID): void
    onGameStart(byPlayer: Player): void
    onGameStop(byPlayer: Player): void
    onPlayerAdminChange(player: Player, byPlayer: Player): void
    onPlayerTeamChange(player: Player, byPlayer: Player): void
    onPlayerKicked(player: Player, reason: string, ban: boolean, byPlayer: Player): void
    onGameTick(): void
    onGamePause(byPlayer: Player): void
    onGameUnpause(byPlayer: Player): void
    onPositionsReset(): void
    onStadiumChange(stadiumName: string, byPlayer: Player): void
    onRoomLink(url: string): void
}
