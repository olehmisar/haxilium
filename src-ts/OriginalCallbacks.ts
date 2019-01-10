import { Scores } from './interfaces/Scores';
import { TeamID } from './interfaces/TeamID';
import { Player } from './models/Player';


const events: string[] = []
const NativeEvent = (): MethodDecorator => (target, propKey) => { events.push(propKey as string) }

export function getNativeEvents(): string[] {
    return events
}

export class OriginalCallbacks {
    @NativeEvent() onPlayerJoin(player: Player): void { }
    @NativeEvent() onPlayerLeave(player: Player): void { }
    @NativeEvent() onTeamVictory(scores: Scores): void { }
    @NativeEvent() onPlayerChat(player: Player, message: string): false | void { }
    @NativeEvent() onPlayerBallKick(player: Player): void { }
    @NativeEvent() onTeamGoal(team: TeamID): void { }
    @NativeEvent() onGameStart(byPlayer: Player): void { }
    @NativeEvent() onGameStop(byPlayer: Player | null): void { }
    @NativeEvent() onPlayerAdminChange(player: Player, byPlayer: Player): void { }
    @NativeEvent() onPlayerTeamChange(player: Player, byPlayer: Player): void { }
    @NativeEvent() onPlayerKicked(player: Player, reason: string, ban: boolean, byPlayer: Player): void { }
    @NativeEvent() onGameTick(): void { }
    @NativeEvent() onGamePause(byPlayer: Player): void { }
    @NativeEvent() onGameUnpause(byPlayer: Player): void { }
    @NativeEvent() onPositionsReset(): void { }
    @NativeEvent() onStadiumChange(stadiumName: string, byPlayer: Player): void { }
    @NativeEvent() onRoomLink(url: string): void { }
}
