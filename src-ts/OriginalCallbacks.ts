import { Scores } from './interfaces/Scores';
import { TeamID } from './interfaces/TeamID';
import { Player } from './models/Player';


export class OriginalCallbacks {
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
}
