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

    /*
     * Set methods of original room object to use and override them in the future.
     */
    sendChat(...args)          { return this._room.sendChat(...args) }
    setPlayerAdmin(...args)    { return this._room.setPlayerAdmin(...args) }
    setPlayerTeam(...args)     { return this._room.setPlayerTeam(...args) }
    kickPlayer(...args)        { return this._room.kickPlayer(...args) }
    clearBan(...args)          { return this._room.clearBan(...args) }
    clearBans(...args)         { return this._room.clearBans(...args) }
    setScoreLimit(...args)     { return this._room.setScoreLimit(...args) }
    setTimeLimit(...args)      { return this._room.setTimeLimit(...args) }
    setCustomStadium(...args)  { return this._room.setCustomStadium(...args) }
    setDefaultStadium(...args) { return this._room.setDefaultStadium(...args) }
    setTeamsLock(...args)      { return this._room.setTeamsLock(...args) }
    setTeamColors(...args)     { return this._room.setTeamColors(...args) }
    startGame(...args)         { return this._room.startGame(...args) }
    stopGame(...args)          { return this._room.stopGame(...args) }
    pauseGame(...args)         { return this._room.pauseGame(...args) }
    getPlayer(...args)         { return this._room.getPlayer(...args) }
    getPlayerList(...args)     { return this._room.getPlayerList(...args) }
    getScores(...args)         { return this._room.getScores(...args) }
    getBallPosition(...args)   { return this._room.getBallPosition(...args) }
    startRecording(...args)    { return this._room.startRecording(...args) }
    stopRecording(...args)     { return this._room.stopRecording(...args) }
}
