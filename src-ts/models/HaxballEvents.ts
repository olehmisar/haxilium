import { Scores } from '../interfaces/Scores';
import { Team } from '../interfaces/Team';
import { Player } from './Player';


/*
 * Users will implement this interface to make type-safe event callbacks
 */
export interface HaxballEventsInterface<TPlayer extends Player> extends Partial<HaxballEvents<TPlayer>> { }

/**
 * Used to get names of haxball events.
 */
export class HaxballEvents<TPlayer extends Player> {
    onPlayerJoin: (player: TPlayer) => void = () => { }
    onPlayerLeave: (player: TPlayer) => void = () => { }
    onTeamVictory: (scores: Scores) => void = () => { }
    onPlayerChat: (player: TPlayer, message: string) => false | void = () => { }
    onPlayerBallKick: (player: TPlayer) => void = () => { }
    onTeamGoal: (team: Team) => void = () => { }
    onGameStart: (byPlayer: TPlayer) => void = () => { }
    onGameStop: (byPlayer: TPlayer | null) => void = () => { }
    onPlayerAdminChange: (player: TPlayer, byPlayer: TPlayer) => void = () => { }
    onPlayerTeamChange: (player: TPlayer, byPlayer: TPlayer) => void = () => { }
    onPlayerKicked: (player: TPlayer, reason: string, ban: boolean, byPlayer: TPlayer) => void = () => { }
    onGameTick: () => void = () => { }
    onGamePause: (byPlayer: TPlayer) => void = () => { }
    onGameUnpause: (byPlayer: TPlayer) => void = () => { }
    onPositionsReset: () => void = () => { }
    onStadiumChange: (stadiumName: string, byPlayer: TPlayer) => void = () => { }
    onRoomLink: (url: string) => void = () => { }
}
