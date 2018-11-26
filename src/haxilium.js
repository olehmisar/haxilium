import _ from 'lodash'
import assert from 'assert'
import deepFreeze from 'deep-freeze-strict'
import setImmediate from 'set-immediate-shim'

import DelegatedHaxballRoom from './delegated-haxball-room'
import { isPlayerObject, parseAccessStringWithRoles, createEnum } from './utils'
import * as errors from './errors'


export default class Haxilium extends DelegatedHaxballRoom {
    CommandNotFoundError       = errors.CommandNotFoundError
    AccessToCommandDeniedError = errors.AccessToCommandDeniedError

    SPECT = 0
    RED = 1
    BLUE = 2
    _modules = {}
    _callbacks = {}
    _players = {}
    _commands = {}
    _roles = {}
    _defaultPlayer = {}

    constructor(config) {
        assert(_.isObject(config), 'Please provide room config')
        config = _.cloneDeep(config)
        super(config)

        this.state = config.state || {}
        this._initPlayers(config)
        this._resetCallbacks()
        if (config.modules) {
            config.modules.forEach(module => this._registerModule(module))
        }
    }

    /**
     * Register room module.
     * @param {Object}   module              Module object.
     * @param {String}   module.name         An unique string module identificator(name).
     * @param {Object[]} module.dependencies An array of modules on which this module depends.
     * @param {Object}   module.player       An object of custom player's properties.
     * @param {Object}   module.defaultState An object where you put all module related variables. This
     *                                       object will be recursively merged with 'defaultState's of
     *                                       other modules and will be set as 'state' property of the room.
     * @param {Object}   module.methods      An object of methods which will be attached to the room.
     *                                       Keys of object are names of methods and values of object
     *                                       are methods themselves.
     * @param {Object}   module.callbacks    An object of callbacks which will be registered. Keys of
     *                                       object are names of events and values are callback functions
     *                                       or arrays of callback functions.
     * @param {Object[]} module.commands     An array of commands to register.
     * @param {Function} module.registered   A function which will be called when module is
     *                                       registered successfully.
     */
    _registerModule(module) {
        assert(_.isObject(module), `Module must be an object but ${typeof module} given`)

        if (this._modules[module.name]) return

        // Fill optional fields with values.
        module = _.defaultsDeep(_.cloneDeep(module), {
            player: {},
            defaultState: {},
            methods: {},
            callbacks: {},
            commands: [],
            dependencies: [],
            registered: _.noop,
        })
        const { name, player, defaultState, methods, callbacks, commands, dependencies } = module

        // Validate module.
        assert(_.isString(name) && name.trim() !== '',
                                         `Module 'name' must be a string but ${typeof name} given`)

        assert(_.isArray(dependencies) && dependencies.every(_.isObject),
                                         `Module 'dependencies' must be an array of modules`)

        assert(_.isObject(player),       `Module 'player' must be an object but ${typeof player} given`)
        assert(_.isObject(defaultState), `Module 'defaultState' must be an object but ${typeof defaultState} given`)

        assert(_.isObject(methods),      `Module 'methods' must be an object of functions but ${typeof methods} given`)
        _.keys(methods).forEach(methodName => assert(_.isUndefined(this[methodName]),
                `Module method intersection error. ${methodName} already exists`))

        assert(_.isObject(callbacks),    `Module 'callbacks' must be an object of functions but ${typeof callbacks} given`)

        assert(_.isArray(commands),      `Module 'commands' must be an array of commands but ${typeof commands} given`)
        const existingCommands = this.getCommands()
        commands.forEach(command => {
            const conflictingNames = _(existingCommands)
                .map(c => _.intersection(c.names, command.names))
                .flatten()
                .join(', ')
            assert(conflictingNames === '', `Command intersection found in ${name} module. Commands with names "${conflictingNames}" already exist`)
        })

        assert(_.isFunction(module.registered), `Module 'registered' must be a function but ${typeof module.registered} given`)


        // First things first, register dependencies.
        dependencies.forEach(dep => this._registerModule(dep))


        // Register module.
        _.forOwn (callbacks, (callback, eventName) => this.on(eventName, callback))
        _.forOwn (player,    (options, propName)   => this._initPlayerProperty(propName, options))
        _.forOwn (methods,   (method, methodName)  => this.method(methodName, method))
        _.forEach(commands,  (command)             => this.addCommand(command))
        this.state[name] = defaultState

        // Save module.
        this._modules[name] = module

        // Call 'registered' hook.
        module.registered.call(this)
    }

    /**
     * Attach callbacks to the event.
     * @param  {String}                eventName Event name. Can be PascalCase, camelCase or kebab-case.
     * @param  {(Function|Function[])} callbacks Function or array of functions which will be called when event fires.
     * @return {Function}                        Function that detaches just attached callbacks.
     */
    on(eventName, callbacks) {
        callbacks = _.castArray(callbacks).map(cb => cb.bind(this))
        eventName = _.camelCase(eventName)

        assert(_.isString(eventName), 'Callback name must be a string')
        assert(callbacks.length > 0, `No callbacks provided for ${eventName} event`)
        assert(callbacks.every(_.isFunction), 'Event callbacks must be functions')

        // Attach callbacks to the event.
        this._callbacks[eventName] = (this._callbacks[eventName] || []).concat(callbacks)

        // Return detaching function.
        return () => void _.pullAll(this._callbacks[eventName], callbacks)
    }

    /**
     * Add method to the room object.
     * @param  {String}   methodName Name of the method.
     * @param  {Function} method     The method itself.
     */
    method(methodName, method) {
        assert(_.isString(methodName), 'Method name must be a string')
        assert(_.isFunction(method),   'Method function must be a function')
        this[methodName] = method
    }

    /**
     * Add command to room object. Later it can be called using 'executeCommand'.
     * @param {Object}   command         Command options.
     * @param {String[]} command.names   Array of names of the command.
     * @param {String    command.access  Boolean expression which determines if player can execute this command.
     *                                   Examples: '>=admin' will allow only players with 'admin' or higher role to execute command,
     *                                   '>=player && <admin' will allow command execution only for players with role higher or
     *                                   equal to 'player' and less than 'admin'.
     * @param {Function} command.execute Command execute function. Params: 'player', 'args'.
     */
    addCommand(command) {
        let { names, access: accessString = '', execute } = command

        // Validate props.
        assert(_.isArray(names),         "Command 'names' must be array of strings")
        assert(names.length > 0,         'Command must have at least one name')
        assert(names.every(_.isString),  `Command 'names' must be array of strings`)
        assert(_.isString(accessString), `Command 'access' must be a string but ${typeof accessString} given`)
        assert(_.isFunction(execute),    "Command 'execute' function must be a function")

        // Normalize props.
        names = names.map(name => name.trim().toLowerCase())
        execute = execute.bind(this)
        const _accessFn = (accessString
            ? parseAccessStringWithRoles(accessString, this._roles)
            : _.stubTrue)

        // Make and freeze command to prevent changes in it.
        command = { ...command, names, access: accessString, _accessFn, execute }
        deepFreeze(command)
        names.forEach(name => {
            this._commands[name] = command
        })
    }

    /**
     * Get command object.
     * @param  {String} name Name of the command.
     * @return {Object}      Command object.
     */
    getCommand(name) {
        return this._commands[name]
    }

    /**
     * Get commands that match 'filterFn' function.
     * @param  {Function} filterFn Function that filters commands.
     * @return {Object[]}          Array of commands.
     */
    getCommands(filterFn = _.stubTrue) {
        return _(this._commands)
            .filter(filterFn)
            .uniq()
            .value()
    }

    /**
     * Execute function with checking player access to it.
     * @param  {PlayerObject} player      The player who executes this command.
     * @param  {String}       rawCommand  A raw command string to parse and execute.
     */
    executeCommand(player, rawCommand = '') {
        assert(_.isString(rawCommand), `Command must be a string but ${typeof rawCommand} is given`)

        // First argument(always lowercase) is name of command.
        const args = rawCommand.trim().split(/\s+/)
        const name = args[0] = _.toLower(args[0])
        const command = this._commands[name]

        if (!command) {
            throw new this.CommandNotFoundError(`Unknown command "${name}"`)
        }

        const playerRole = this._roles[this._getPlayerRole(player)] || 0
        const canExecute = command._accessFn(playerRole)

        if (!canExecute) {
            throw new this.AccessToCommandDeniedError(
                `${player.name} isn't allowed to execute "${name}"`)
        }

        return command.execute(player, args)
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
     * Get player by id.
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
        config.player = config.player || {}

        // Iterate over each setter and extend room object with it.
        _.forOwn(config.player, (options, propName) =>
            this._initPlayerProperty(propName, options))

        // Get player roles.
        this._roles = createEnum(config.roles || [])

        // Get function which calculates player's role. Or make default one.
        this._getPlayerRole = config.getRole || (p => '')

        assert(_.isFunction(this._getPlayerRole), "'config.getRole' must be a function")
    }

    /**
     * Attach method to the room which sets 'propName' on player and calls callbacks.
     * @param  {String}   propName        Name of player model property.
     * @param  {Object}   options         Property options.
     * @param  {}         options.default Default value of property.
     * @param  {Function} options.set     Optional. Property setter. First argument is player object, the rest arguments are values to set. If returns 'false' callbacks will not be called.
     * @param  {String}   options.method  Optional. Defines a name of method which will be attached to the room.
     * @param  {String}   options.event   Optional. Defines a name of event which will be fired.
     */
    _initPlayerProperty(propName, options) {
        assert(!_.has(this._defaultPlayer, propName),
            `Cannot add additional player property ${propName}. ${propName} is already initialized`)

        // Expand shourcut options and extend with 'default options.
        options = _.isObject(options) ? options : { default: options }
        _.defaultsDeep(options, {
            set(player, value) {
                if (_.isEqual(player[propName], value))
                    return false
                player[propName] = value
            },
            method: _.camelCase(`set-player-${propName}`),
            event: _.camelCase(`player-${propName}-change`),
        })
        options.set = options.set.bind(this)

        this._defaultPlayer[propName] = options.default

        // Define method which will be attached to the room.
        const methodFn = (id, ...values) => void setImmediate(() => {
            let player = this.getPlayer(id)
            if (!player) return

            // Set and save player's properties.
            const setterReturn = options.set(player, ...values)
            this._players[id] = player
            if (setterReturn !== false) {
                // Send player copy to the callbacks.
                player = _.cloneDeep(player)
                this._executeCallbacks(options.event, [player])
            }
        })

        this.method(options.method, methodFn)
    }

    /**
     * Make a new player based on default player object.
     * @return {Object} New player object.
     */
    _playerFactory() {
        return _.cloneDeep(this._defaultPlayer)
    }

    /**
     * Player filter which is used in 'getPlayerList()' method.
     * @param  {Object} player Player who will be filtered or not.
     * @param  {Object} opts   Filter options. Player must have the
     *                         same properties as options have to pass the filter.
     * @return {Boolean}       'true' if player is not filtered, otherwise 'false'.
     */
    _playerFilter(player, opts) {
        if (player.id === 0) return false
        for (let [key, filterValue] of _.entries(opts)) {
            if (!_.isEqual(player[key], filterValue))
                return false
        }
        return true
    }

    /**
     * Delete callbacks which are present and (re)set default callbacks.
     */
    _resetCallbacks() {
        this._callbacks = {}

        this.on('room-link', () => this._executeCallbacks('ready'))

        this.on('playerLeave', player => setImmediate(() => {
            delete this._players[player.id]
        }))
    }

    /**
     * Execute callbacks which are attached to specific event.
     * @param  {String} eventName    Name of the event which is fired.
     * @param  {Array}  callbackArgs Array of arguments which are passed to the callbacks.
     * @return {(Boolean|Undefined)} Returns 'false' if some callback returns 'false', otherwise 'undefined'.
     */
    _executeCallbacks(eventName, callbackArgs = []) {
        eventName = _.camelCase(eventName)
        const callbacks = this._callbacks[eventName]
        if (!callbacks) return

        // Freeze args to prevent changes in them.
        deepFreeze(callbackArgs)

        // Store all results of calls of callbacks.
        const cbReturns = []
        for (let i = 0; i < callbacks.length; i++) {
            try {
                // Execute callback and push result to all results.
                cbReturns.push(callbacks[i](...callbackArgs))
            } catch (err) {
                console.error(err)
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
     * Extend player instance with additional properties.
     * @param  {PlayerObject} rawPlayer Raw player object which will be extended.
     * @return {PlayerObject}           Extended player object.
     */
    _wrapPlayer(rawPlayer) {
        // If player's additional properties don't exist yet, create them.
        if (!this._players[rawPlayer.id])
            this._players[rawPlayer.id] = this._playerFactory()
        // Merge player and additional properties.
        return { ...this._players[rawPlayer.id], ...rawPlayer }
    }
}
