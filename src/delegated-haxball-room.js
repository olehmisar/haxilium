import _ from 'lodash'
import setImmediate from 'set-immediate-shim'


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

            // Remove callback to prevent second initialization.
            window.onHBLoaded = _.noop
        }

        // If room initialization function is loaded, initialize room.
        if (window.HBInit) {
            // Initialize asynchronously because room must be initialized
            // asynchronously by definition with or without 'onHBLoaded'.
            setImmediate(window.onHBLoaded)
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
