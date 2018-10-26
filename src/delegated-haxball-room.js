/**
 * Original API callbacks' names.
 * @type {String[]}
 */
const delegatedCallbacks = [
    'onPlayerJoin',
    'onPlayerLeave',
    'onTeamVictory',
    'onPlayerChat',
    'onPlayerBallKick',
    'onTeamGoal',
    'onGameStart',
    'onGameStop',
    'onPlayerAdminChange',
    'onPlayerTeamChange',
    'onPlayerKicked',
    'onGameTick',
    'onGamePause',
    'onGameUnpause',
    'onPositionsReset',
    'onPlayerActivity',
    'onStadiumChange',
    'onRoomLink',
]

export default class DelegatedHaxballRoom {
    constructor(config) {
        config = config.room
        window.onHBLoaded = () => {
            const roomName   = config.roomName   || config.name   || 'Headless Room'
            const playerName = config.playerName || config.player || 'Host'
            const maxPlayers = config.maxPlayers || 12
            const password   = config.password   || undefined
            const geo        = config.geo        || undefined
            const isPublic   = 'public' in config ? !!config.public : true
            this._room = HBInit({ ...config, roomName, playerName, maxPlayers, isPublic, geo })

            this._delegateMethods()
            this._delegateCallbacks()
        }
    }

    /*
     * Delegate callbacks of original API.
     */
    _delegateCallbacks() {
        // Delegate original room callbacks to original room object
        delegatedCallbacks.forEach(rawCallbackName => {
            // skip 'on' in callback name
            const callbackName = rawCallbackName.substr(2)
            // Assign a function to an original room object.
            this._room[rawCallbackName] = (...args) => {
                return this._executeCallbacks(callbackName, this._wrapArguments(args))
            }
        })
    }

    _delegateMethods() {
        // Delegate original room methods to framework.
        _.forOwn(this._room, prop => {
            DelegatedHaxballRoom.prototype[prop] = this._room[prop]
        })
    }
}
