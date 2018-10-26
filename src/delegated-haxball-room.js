import _ from 'lodash'


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
        window.onHBLoaded = () => {
            this._room = window.HBInit(config)
            this._delegateMethods()
            this._delegateCallbacks()
        }

        if (window.HBInit) {
            window.onHBLoaded()
        }
    }

    /**
     * Delegate callbacks of the original API.
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

    /**
     * Delegate methods of the original API.
     */
    _delegateMethods() {
        // Delegate original room methods to framework.
        _.forOwn(this._room, (value, key) => {
            if (_.isFunction(value)) {
                DelegatedHaxballRoom.prototype[key] = value
            }
        })
    }
}
