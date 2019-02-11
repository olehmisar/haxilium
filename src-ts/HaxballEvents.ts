import { Scores } from './interfaces/Scores';
import { Team } from './interfaces/Team';
import { Player } from './models/Player';

/**
 * Users will implement this interface to make type-safe event callbacks
 */
export interface HaxballEvents extends HaxballEventsClass { }

/**
 * Used to get names of haxball events.
 */
export class HaxballEventsClass {
    onPlayerJoin: (player: Player) => void = () => { }
    onPlayerLeave: (player: Player) => void = () => { }
    onTeamVictory: (scores: Scores) => void = () => { }
    onPlayerChat: (player: Player, message: string) => false | void = () => { }
    onPlayerBallKick: (player: Player) => void = () => { }
    onTeamGoal: (team: Team) => void = () => { }
    onGameStart: (byPlayer: Player) => void = () => { }
    onGameStop: (byPlayer: Player | null) => void = () => { }
    onPlayerAdminChange: (player: Player, byPlayer: Player) => void = () => { }
    onPlayerTeamChange: (player: Player, byPlayer: Player) => void = () => { }
    onPlayerKicked: (player: Player, reason: string, ban: boolean, byPlayer: Player) => void = () => { }
    onGameTick: () => void = () => { }
    onGamePause: (byPlayer: Player) => void = () => { }
    onGameUnpause: (byPlayer: Player) => void = () => { }
    onPositionsReset: () => void = () => { }
    onStadiumChange: (stadiumName: string, byPlayer: Player) => void = () => { }
    onRoomLink: (url: string) => void = () => { }
}
