import { NativePlayer } from '../interfaces/NativePlayer';
import { RoomConfig } from '../interfaces/RoomConfig';
import { Scores } from '../interfaces/Scores';
import { TeamID } from '../interfaces/TeamID';
import { Vector } from '../interfaces/Vector';


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
    getPlayer(playerId: number): NativePlayer | null
    getPlayerList(): NativePlayer[]
    getScores(): Scores | null
    getBallPosition(): Vector | null
    startRecording(): void
    stopRecording(): Uint8Array | null
    setPassword(password: string): void


    onPlayerJoin(player: NativePlayer): void
    onPlayerLeave(player: NativePlayer): void
    onTeamVictory(scores: Scores): void
    onPlayerChat(player: NativePlayer, message: string): void | false
    onPlayerBallKick(player: NativePlayer): void
    onTeamGoal(team: TeamID): void
    onGameStart(byPlayer: NativePlayer): void
    onGameStop(byPlayer: NativePlayer): void
    onPlayerAdminChange(player: NativePlayer, byPlayer: NativePlayer): void
    onPlayerTeamChange(player: NativePlayer, byPlayer: NativePlayer): void
    onPlayerKicked(player: NativePlayer, reason: string, ban: boolean, byPlayer: NativePlayer): void
    onGameTick(): void
    onGamePause(byPlayer: NativePlayer): void
    onGameUnpause(byPlayer: NativePlayer): void
    onPositionsReset(): void
    onStadiumChange(stadiumName: string, byPlayer: NativePlayer): void
    onRoomLink(url: string): void
}
