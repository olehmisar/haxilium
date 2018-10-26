import DelegatedHaxballRoom from './delegated-haxball-room'
import { isPlayerObject, parseAccessStrings } from './utils'
import setImmediate from 'set-immediate-shim'
import assert from 'assert'
import _ from 'lodash'

export default class Haxilium extends DelegatedHaxballRoom {
    SPECT = 0
    RED = 1
    BLUE = 2
    _players = {}
    _commands = []

    constructor(config) {
        assert(_.isObject(config), 'Please provide room config')
        super(config)
        this.state = config.state || {}
        this._initPlayers(config)
        this._resetCallbacks()
    }

    /**
     * Bind callbacks to the room.
     * @param  {String}     callbackName Event name. Can be PascalCase, camelCase or kebab-case.
     * @param  {Function[]} callbacks    Array of functions which will be executed when event fires. Can be array of arrays of functions.
     * @return {Function}                Unbind callbacks function. Uses to unbind just binded callbacks. No parameters.
     */
    on(cbName, ...callbacks) {
        callbacks = _.flatten(callbacks)
        cbName = _.camelCase(cbName)

        assert(_.isString(cbName), 'Callback name must be a string')
        assert(callbacks.length > 0, 'No callbacks provided for binding')
        assert(callbacks.every(_.isFunction), 'Event callbacks must be functions')

        if (!this._callbacks[cbName]) this._callbacks[cbName] = []
        // Bind callbacks to 'this'.
        callbacks = callbacks.map(cb => cb.bind(this))
        // Bind callbacks to events.
        this._callbacks[cbName].push(...callbacks)
        // Return unbinding function.
        return () => {
            this._callbacks[cbName] = this._callbacks[cbName]
                .filter(cb => !callbacks.includes(cb))
        }
    }

    /**
     * Add method to the room object.
     * @param  {String}   actionName   Name of the method.
     * @param  {String}   callbackName Name of the callback to trigger when method is called.
     * @param  {Boolean}  isAsync      Determines is mehod async or not. Optional, default is true.
     * @param  {Function} execute      The method itself.
     */
    method(...args) {
        let actionName, callbackName, isAsync, execute
        switch (args.length) {
            case 2:
                ;[actionName, execute] = args
                callbackName = ''
                isAsync = true
                break
            case 3:
                ;[actionName, , execute] = args
                callbackName = _.isString(args[1]) ? args[1] : ''
                isAsync     = _.isBoolean(args[1]) ? args[1] : true
                break
            case 4:
                ;[actionName, callbackName, isAsync, execute] = args
                break
            default:
                throw new Error("Invalid number of arguments passed to 'method' function")
        }

        assert(_.isString(actionName),   'Action name must be a string')
        assert(_.isString(callbackName), 'Callback name must be a string')
        assert(_.isBoolean(isAsync),     "Parameter 'isAsync' must be boolean")
        assert(_.isFunction(execute),    "Method 'execute' function must be a function")

        if (callbackName) callbackName = _.camelCase(callbackName)
        // Bind function to 'this'.
        execute = execute.bind(this)

        const actionFn = (...args) => {
            try {
                // Get callback arguments.
                const callbackArgs = execute(...args)
                // If there is no callback name provided or args is false, don't execute the callback.
                if (callbackName && callbackArgs !== false)
                    this._executeCallbacks(callbackName, callbackArgs)
            } catch (err) {
                // Catch error and send message to room chat.
                console.error(err)
                this.sendChat('WARNING! There is an error in the code!')
            }
        }
        // Make a room method async or sync.
        this[actionName] = isAsync
            ? (...args) => void setImmediate(() => actionFn(...args))
            : actionFn
    }

    /**
     * Add command to room object. Later it can be called using 'executeCommand'.
     * @param {String[]} options.names        Array of names of the command.
     * @param {String}   options.description  User friendly description of the command.
     * @param {String[]} options.access       Array of conditions. Condition can be '>lvl', '<lvl', '>=lvl', '<=lvl', '=lvl' or 'lvl'(translates to '>=lvl'), where 'lvl' is unsigned number which determines what level of rights does player need to execute this command. If just 'lvl' is given, it is transformed to '>=lvl'.
     * @param {Function} options.execute      Command execute function. Params: 'player', 'args'.
     */
    addCommand({ names, description, examples, access: accessStrings, execute }) {
        // Validate arguments.
        assert(_.isArray(accessStrings), "Command 'access' must be array of values")
        assert(_.isFunction(execute),    "Command 'execute' function must be a function")
        assert(names.length > 0,         'Command must have at least one name')
        assert(!names.some(_.isEmpty),   'Invalid name of command')

        // Normalize arguments.
        names = names.map(name => name.trim().toLowerCase())
        execute = execute.bind(this)
        const accessFn = parseAccessStrings(accessStrings)

        // Add command.
        this._commands.push({ names, description, examples, access: accessStrings, accessFn, execute })
    }

    /**
     * Get info of each command.
     * @param  {String} commandName  Name of the desired command. All other commands will be filtered out.
     * @return {Array}               Array of commands' info.
     */
    getCommandsInfo(commandName) {
        let commands = this._commands
        if (commandName)
            commands = commands.filter(({ names }) => names.includes(commandName))

        return commands.map(command => ({
            names: _.clone(command.names),
            description: _.clone(command.description),
            examples: _.clone(command.examples),
        }))
    }

    /**
     * Execute function with checking player access to it.
     * @param  {PlayerObject} player      The player who executes this command.
     * @param  {String}       rawCommand  A raw command string to parse and execute.
     */
    executeCommand(player, rawCommand = '') {
        rawCommand = rawCommand.trim()
        if (!rawCommand) return
        // Get command arguments.
        const args = rawCommand.split(/\s+/)
        // First argument(always lowercase) is name of command.
        const name = args[0] = args[0].toLowerCase()
        // Find command object
        const commandObject = this._commands.find(({ names }) => names.includes(name))
        if (!commandObject) return

        // Obtain execute access functions and command function itself.
        const { accessFn, execute } = commandObject

        // Get player's rights.
        const playerRights = this._getPlayerRights(player)
        // Determine if SOME player's rights match EVERY access function.
        const canExecute = playerRights.some(rights => accessFn(rights))

        // Execute command if allowed.
        if (!canExecute) return
        return execute(player, args)
    }

    /**
     * Dispatch the event.
     * @param  {String} eventName The name of event which will be dispatched.
     * @param  {Array}  args      Arguments to pass to callbacks.
     */
    dispatch(eventName, args) {
        this._executeCallbacks(eventName, args)
    }

    /**
     * Get player list with smart options.
     * @param  {Number[]} teamsOrder                Determines in which order will be teams sorted. Optional.
     * @param  {Object}   opts                      Options which will be passed to 'filter' method of player model. Optional.
     * @return {(PlayerObject[]|PlayerObject[][])}  If 'teamsOrder' is empty array than no sorting by team will be made and just array of 'PlayerObject's will be returned. Otherwise, the return value will be array of teams.
     */
    getPlayerList(teamsOrder = [], opts = {}) {
        if (!_.isArray(teamsOrder)) {
            opts = teamsOrder
            teamsOrder = []
        }

        const players = []
        for (let p of super.getPlayerList()) {
            p = this._wrapPlayer(p)
            if (this._playerFilter(p, opts)) players.push(p)
        }

        // Return just array of players.
        if (teamsOrder.length === 0) return players

        // Return array of teams.
        const teams = [[], [], []]
        teamsOrder = teamsOrder.slice(0, 3)
        for (let p of players) {
            // Get team index of returning array.
            let index = teamsOrder.indexOf(p.team)
            // If no order index is given, append team to the end.
            if (index === -1) index = teamsOrder.length
            teams[index].push(p)
        }
        return teams
    }

    /**
     * Get player by id and extend it.
     * @param  {Number}       id Id of the player to return.
     * @return {PlayerObject}    Extended player object.
     */
    getPlayer(id) {
        return this._wrapPlayer(super.getPlayer(id))
    }

    /**
     * Inits player model and extends the room object with player's setters.
     * @param {Object} config Room config.
     */
    _initPlayers(config) {
        // Get fields and their names.
        const fields = config.player.fields
        // Iterate over each setter and extend room object with it.
        _.toPairs(fields).forEach(([fieldName, defaultValue]) => {
            // Make default setter to use it if no custom setter is provided.
            let setter = (player, value) => {
                // Return false to prevent executing callbacks.
                if (_.isEqual(player[fieldName], value)) return false
                player[fieldName] = value
            }

            // Set default values for setter.
            let isAsync = true, methodName = fieldName

            // If 'defaultValue' of field is object of options then use them.
            if (_.isObject(defaultValue)) {
                const opts = defaultValue
                methodName = opts.methodName || methodName
                setter     = opts.set        || setter
                isAsync    = _.isBoolean(opts.async) ? opts.async : isAsync
                // Make the default value of property.
                defaultValue = opts.default
            }

            // Build action name and callback name using kebab-case style.
            const fullMethodName = _.camelCase(`set-player-${methodName}`)
            const callbackName   = `player-${methodName}-change`
            // Bind setter to 'this'.
            setter = setter.bind(this)

            // Extend the room using setter and its props.
            this.method(fullMethodName, callbackName, isAsync, function (id, ...values) {
                let player = this.getPlayer(id)
                // Return false to prevent executing callbacks.
                if (!player) return false

                const callbackArgs = setter(player, ...values)
                // Save player's fields.
                this._players[id] = player

                // Return false to prevent executing callbacks.
                if (callbackArgs === false) return false
                // Callback args to pass to callbacks.
                return callbackArgs || [player]
            })
        })

        // Make default player instance.
        // If 'defaultValue' is object of options then use them.
        const defaultPlayer = _.mapValues(fields, defaultValue =>
                _.isObject(defaultValue) ? defaultValue.default : defaultValue)
        // Build player factory to extend default player object.
        this._playerFactory = () => _.cloneDeep(defaultPlayer)

        // Get function which calculates player's rights or make default one.
        this._getPlayerRights = config.player.rights || (p => [0])
        // Get function which filters when players getting them using 'getPlayerList' or make default one.
        this._playerFilter    = config.player.filter || _.stubTrue

        assert(_.isFunction(this._getPlayerRights), "'player.rights' must be a function")
        assert(_.isFunction(this._playerFilter),    "'player.filter' must be a function")
    }

    /**
     * Delete callbacks which are present and (re)set default callbacks.
     */
    _resetCallbacks() {
        this._callbacks = {}
        this.on('playerLeave', player => setImmediate(() => {
            delete this._players[player.id]
        }))
    }

    /**
     * Execute callbacks which are binded to specific event.
     * @param  {String} callbackName  Name of the event which is fired.
     * @param  {Array}  callbackArgs  Array of arguments which are passed to the callbacks.
     * @return {(Boolean|Undefined)}  Returns 'false' if some callback returns 'false', otherwise 'undefined'
     */
    _executeCallbacks(callbackName, callbackArgs = []) {
        callbackName = _.camelCase(callbackName)
        const callbacks = this._callbacks[callbackName]
        if (!callbacks) return

        // Store all results of calls of callbacks.
        const cbReturns = []
        // Use 'for loop' instead of 'forEach method' to improve perfomance.
        for (let i = 0; i < callbacks.length; i++) {
            try {
                // Execute callback and push result to all results.
                cbReturns.push(callbacks[i](...callbackArgs))
            } catch (err) {
                console.error(err)
                this.sendChat('WARNING! There is an error in the code!')
            }
        }
        // If some callback has returned 'false' then return false
        if (cbReturns.some(value => value === false)) return false
    }

    /**
     * All arguments which are passed to callbacks are piped through this function.
     * It loops over each argument and wraps this argument if it is player object.
     * @param  {Array} args The arguments to be piped through.
     * @return {Array}      New wrapped arguments.
     */
    _wrapArguments(args) {
        const newArgs = []
        for (let arg of args) {
            const newArg = isPlayerObject(arg) ? this._wrapPlayer(arg) : arg
            newArgs.push(newArg)
        }
        return newArgs
    }

    /**
     * Extend player instance with additional fields.
     * @param  {PlayerObject} rawPlayer Raw player object which will be extended.
     * @return {PlayerObject}           Extended player object.
     */
    _wrapPlayer(rawPlayer) {
        // If player's additional fields don't exist yet, create them.
        if (!this._players[rawPlayer.id])
            this._players[rawPlayer.id] = this._playerFactory()
        // Merge player and additional player's fields.
        return { ...this._players[rawPlayer.id], ...rawPlayer }
    }
}
