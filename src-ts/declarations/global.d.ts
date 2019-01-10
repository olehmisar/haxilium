import { NativePlayer } from '../interfaces/NativePlayer';
import { RoomConfig } from '../interfaces/RoomConfig';
import { Scores } from '../interfaces/Scores';
import { TeamID } from '../interfaces/TeamID';


declare global {
    interface Window {
        HBInit(config: RoomConfig): any
        onHBLoaded(): void
    }
}

declare interface RoomObject {
    onPlayerJoin(player: NativePlayer): void
    onPlayerLeave(player: NativePlayer): void
    onTeamVictory(scores: Scores): void
    onPlayerChat(player: NativePlayer, message: string): void | false
    onPlayerBallKick(player: NativePlayer): void
    onTeamGoal(team: TeamID): void
    onGameStart(byPlayer: NativePlayer): void
    onGameStop(byPlayer: NativePlayer | null): void
    onPlayerAdminChange(player: NativePlayer, byPlayer: NativePlayer): void
    onPlayerTeamChange(player: NativePlayer, byPlayer: NativePlayer | null): void
    onPlayerKicked(player: NativePlayer, reason: string, ban: boolean, byPlayer: NativePlayer | null): void
    onGameTick(): void
    onGamePause(byPlayer: NativePlayer): void
    onGameUnpause(byPlayer: NativePlayer): void
    onPositionsReset(): void
    onStadiumChange(stadiumName: string, byPlayer: NativePlayer): void
    onRoomLink(url: string): void
}
