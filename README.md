# Haxilium
Haxball Headless API Framework for easy and organized development.

```js
import haxilium from 'haxilium'

const room = haxilium({ roomName: 'Haxilium Room' })
room.on('ready', function () {
    console.log('Hello, World!')
})
```

## Installation
Use following command to install Haxilium:
```shell
npm install haxilium
```
That's all!


## Getting started
Haxilium is very similar to the original [Haxball Headless API] because it is a thin wrapper over it. That's why it is simple to get started.

### Create a room
Use `haxilium(config: RoomConfig)` to create a room:
```js
import haxilium from 'haxilium'

const room = haxilium({
    roomName: 'Haxilium Room',
    playerName: 'Haxilium Bot',
    maxPlayers: 10,
    public: true,
    geo: { code: 'en', lat: 52, lon: 0 }
})
```
The above code will create a __public__ haxball room with "__Haxilium Room__" name , "__Haxilium Bot__" player(bot) name, maximum amount of players of __10__ and with geolocation of __England__.

#### `RoomConfig`
`RoomConfig` is the same as in [Haxball Headless API]. You can look at description of room config [here][Haxball Headless API room config].

#### `PlayerObject` extension
In addition, Haxilium provides more `RoomConfig` properties:
- `player: object`
- `roles: string[]`
- `getRole(): function`

More info about `roles` and `getRole()` you can find in [command system section](#player-roles). `player` property is an object where you put additional [`PlayerObject`][Haxball Headless API player object] properties where __key__ is __name__ of property and __value__ is __default value__ of property:
```js
const room = haxilium({
    roomName: 'Haxilium room',
    player: {
        afk: false,
        confirmed: false
    }
})
```

In the above code we see that we've made two additional `PlayerObject` properties with `false` as default value of both:
- `afk`
- `confirmed`

Two room methods are created automatically:
- `setPlayerAfk(playerID: int, afk: bool)`
- `setPlayerConfirmed(playerID: int, confirmed: bool)`

And two events are created automatically too. Signatures of callbacks for them are:
- `playerAfkChange(player: PlayerObject)`
- `playerConfirmedChange(player: playerObject)`

The next code sample is an example of using `afk` property. We will toggle player's `afk` property when he writes `'afk'` in chat. In this code we use callbacks and methods. If you are not familiar with them you can skip this code snippet.

_Don't use this code in your real project because there is a better solution using [commands](#add-commands)._
```js
room.on('playerChat', function (player, message) {
    if (message === 'afk') {
        // Use `setPlayerAfk()` method.
        if (player.afk) {
            this.setPlayerAfk(player.id, false)
        } else
            this.setPlayerAfk(player.id, true)
        }
    }
})

// Register callback for 'playerAfkChange()' event.
room.on('playerAfkChange', function (player) {
    // Notify players about someone is (is not) afk.
    if (player.afk) this.sendChat(player.name + ' is afk')
    else            this.sendChat(player.name + ' is not afk')
})
```


### Attach callbacks
[Full list of events][Haxball Headless API events]

To attach callback to the event we use `on(event: string, callbackFn: function)`. For example, a `playerJoin` event will be fired when a player joins the room. We register a callback that notifies us when some player joins the room:
```js
room.on('playerJoin', function (player) {
    console.log(player.name + ' has joined')
})
```

__NOTE__ that event name is __not__ sensitive to different styles of cases. In other words, `player-join`, `PlayerJoin` and `playerJoin` is the same event but `pLayerJOin`, `PlAyerjoin` and `plAYerJoin` are different. There must be clear difference between them. I recommend to use `camelCase` for event names and I will use it in the next sections.

Ok, let's add one more callback which will greet player when he joins the room:
```js
room.on('playerJoin', function (player) {
    // 'this' refers to the 'room' object. Don't use 'room' inside of callbacks.
    this.sendChat('Welcome, ' + player.name)
})
```

In result, we have two registered callbacks. First one will `console.log()` that player has joined the room. Second callback will greet that player.

__NOTE__ that registration __order__ of callbacks __matters__. This means that __second callback__ will be called __after__ __first one__, __third__ will be called __after__ __second__ etc.

Also we can pass an array of callbacks to register them in one go:
```js
function cb0() {
    console.log('This message is shown first')
}

function cb1() {
    console.log('This message is shown second')
}

room.on('playerJoin', [cb0, cb1])
```

When we don't want to use a callback anymore we can detach it:
```js
// 'room.on()' returns 'detach()' function which detaches just attached callback.
const detach = room.on('playerJoin', function (player) {
    console.log(player.name + ' has joined')
})

...

// Later in the code we detach callback and will not get 'player has joined' notifications anymore.
detach()
```

To see full list of events visit [this page][Haxball Headless API events].


### Create methods
[Full list of room methods][Haxball Headless API methods]

Besides default methods and methods which are automatically created for us by Haxilium(e.g., `setPlayerAfk()` from the [above section](#playerobject-extension)), we can create our own methods. We use `method(name: string, methodFn: function)` to attach `methodFn` function to the room under the `name` name. In the following code we create function which adds `'INFO: '` prefix to the message that we want to send to the player:
```js
room.method('sendChatInfo', function (message, playerID) {
    // 'this' refers to the 'room' object. Don't use 'room' inside of callbacks, methods etc.
    // Send prefixed message.
    this.sendChat('INFO: ' + message, playerID)
})
```

Then we can use `sendChatInfo(message: string, playerID: int)`. If player types `'get info'` in a chat we will send some info message to him:
```js
room.on('playerChat', function (player, message) {
    if (message === 'get info') {
        // Sends "INFO: This is info message" to this player.
        this.sendChatInfo('This is info message', player.id)
    }
})
```
To see full list of methods visit [this page][Haxball Headless API methods].


### Add commands
<!-- TODO: describe command making better. -->

Creating commands is very simple with Haxilium. Just use `addCommand(command: CommandObject)`. `CommandObject` has only 3 properties:
- `names: string[]` - names of command
- `execute(player: PlayerObject, args: string[]): function` - the command function itself. Accepts `PlayerObject` who executes command as first parameter and `args` array as second parameter
- `access: string` - boolean expression which determines if player can or cannot execute this command. Optional. [More info](#player-roles)

We will make command that adds two numbers provided by player. For example: `add 2 5` will send `'2 + 5 = 7'` message to the player. Now let's look at code:
```js
room.addCommand({
    names: ['add'],
    execute(player, args) {
        // First argument is name of the command.
        // And rest arguments are arguments after name of the command.
        assert(args[0] === 'add')

        // Convert strings to numbers.
        const a = Number(args[1])
        const b = Number(args[2])
        this.sendChat(`${a} + ${b} = ${a + b}`, player.id)
    }
})
```

Then we want players to execute this command. We use `executeCommand(player, command)` to do this:
```js
room.on('playerChat', function (player, message) {
    if (message[0] === '!') {
        // Remove '!' symbol.
        const command = message.substring(1, message.length)
        this.executeCommand(player, command)
    }
})
```

__NOTE__ that we pass a `string` to the `executeCommand(player, command)`. For example: `executeCommand(player, 'add 2 5')`. After that, the command will be parsed and passed to the `execute(player, args)` function. `args` is an __array of strings__. First argument `args[0]` is the name of the command. In our case, `args[0] === 'add'`, `args[1] === '2'` and `args[2] === '5'`.


### Player roles
When we are going to make a big project, we want to make roles for players. For example, we don't want `!kick` command to be available for every player but only for admins. So, we introduce roles in our project. All roles are specified in config under the `roles` field and are an array similar to this: `['player', 'admin']`. Roles array is an hierarchy where roles that has smaller index are lower in the hierarchy table. In our array `'player'` < `'admin'` because `'player'` has smaller index than `'admin'` in `['player', 'admin']` array. To calculate role for every player we specify `getRole(player: PlayerObject)` in config:
```js
import haxilium from 'haxilium'

const room = haxilium({
    roomName: 'Haxilium Room',
    playerName: 'Haxilium Bot',
    maxPlayers: 10,

    // Define additional fields for player object.
    player: {
        afk: false
    },
    // Array of roles.
    roles: ['player', 'admin'],
    getRole(player) {
        // Only players who have admin rights in the room can access admin commands.
        if (player.admin) return 'admin'
        // All other players have basic rights.
        else              return 'player'
    }
})
```

Now let's define `!kick` command. We use `access` property on `CommandObject` to limit access to this command:
```js
room.addCommand({
    names: ['kick'],
    // For all players whose role is greater or equal (>=) to 'admin'
    access: '>=admin',
    execute(player, args) {
        const badPlayerId = Number(args[1])
        this.kickPlayer(badPlayerId, 'Kick by ' + player.name)
    }
})
```

Also, you can make more complicated `access` strings. Available operators are: `==`(`===`), `>`, `>=`, `<`, `<=`, `||`, `&&` and parenthesis `()` for precedence. For example:
- `'>player && <admin'` will allow command execution only for players whose role is greater `(>)` than `'player'` and `(&&)` less `(<)` than `'admin'`
- `'<player || >admin'` will allow command execution only for players whose role is less `(<)` than `'player'` or `(||)` greater `(>)` than `'admin'`.
- `'<player || (>player && <admin)'` will allow command execution only for players whose role is less `(<)` than `'player'` or `(||)` greater `(>)` than `'player'` and `(&&)` less `(<)` than `'admin'`. Notice parenthesis.


### Get commands
It is useful to retrieve commands when we need them. For example, we are going to make user-friendly bot that has `!help` command in it. We use `getCommand(name: string)` to get command by name and `getCommands(filterFn: function)` to get all commands which match `filterFn` function:
```js
// Add '!afk' command.
room.addCommand({
    names: ['afk'],
    // Define 'help' field for command. It will be saved with other custom fields that you define on CommandObject.
    help: 'Toggle your afk status',
    execute(player, args) {
        this.setPlayerAfk(player.id, !player.afk)
    }
})

room.addCommand({
    names: ['help'],
    execute(player, args) {
        const commandName = args[1]
        if (commandName) {
            // Send command help message to the player.
            const command = this.getCommand(commandName)
            this.sendChat(command.help)
        } else {
            // Send list of commands that have 'help' field.
            const commandNames = this.getCommands(command => command.help !== undefined)
                .map(command => command.names[0])
                .join(', ')

            this.sendChat(commandNames)
        }
    }
})
```

Now, if player types `!help afk` in chat, he will get `'Toggle your afk status'` help message. And when he writes just `!help` command he will get full list of commands which provide help messages.


## Module system

### Introduction
Haxilium provides module system. Module is an object which contains following fields: `name`, `defaultState`, `methods`, `callbacks` and `commands`. `name` is required, all other fields are optional. Let's look at module example. The following module includes:
- `testModule` name
- `testMessage` state property
- `sendTestMessage()` method
- `playerJoin()` callback
- x2 `playerChat()` callbacks
- `!test` command

```js
const testModuleObject = {
    name: 'testModule',
    // Define default state of the module. We will be able to access this state object later.
    defaultState: {
        testMessage: 'This is a test message. Room is working properly'
    },
    methods: {
        sendTestMessage() {
            // Retrieve 'testMessage' from room state.
            // The path is        'this.state.moduleName.variableName'.
            // In our case, it is 'this.state.testModule.testMessage'.
            this.sendChat(this.state.testModule.testMessage)
        }
    },
    callbacks: {
        playerJoin(player) {
            this.sendChat('Type !test to get test message')
        },
        // Pass an array of callbacks.
        playerChat: [
            function (player, message) {
                if (message == '!test') {
                    executeCommand(player, 'test')
                }
            },
            function (player, message) {
                // Log all the messages.
                console.log(`${player.name}: ${message}`)
            }
        ]
    },
    commands: [{
        names: ['test'],
        execute() {
            this.sendTestMessage()
        }
    }]
}
```

Now we have to register that module:
```js
room.registerModule(testModuleObject)
```

Ok, that was a lot of code. Let's analyze it in details.
1. We define `name` property of the module which is set to `'testModule'`. It is name of the module which we will use later.
2. The next piece is `defaultState` object. We can see `testMessage` variable in it. Later, we will be able to retrieve this variable using `this.state.testModule.testMessage`.
3. After `defaultState` we define `methods`. It is an object where __keys__ are __names__ of methods and __values__ are __methods__ themselves. Nothing special.
4. Then we see `callbacks` object. Like `methods`, __keys__ are __names of events__ and __values__ are __callbacks__ or __arrays of callbacks__.
5. The last field we have defined is `commands` array. It is array of command objects. Click [here](#add-commands) for detail info about commands.

That's all! That is our module! Now, when player join the room he will see `'Type !test to get test message'`. Then, if he wants, he can write `!test` in chat and he will receive `'This is a test message. Room is working properly'` message. Also, we `console.log()` every message players send.

Also, if we don't need this `testModule` anymore, we can deregister it by its name:
```js
room.deregisterModule(testModuleObject.name)
```
or
```js
room.deregisterModule('testModule')
```


### Afk module example
Below you can see example of afk system module:
```js
import haxilium from 'haxilium'

const room = haxilium({
    // Room config...
    player: {
        // Make afk field for player.
        afk: false
    }
})

// Register callback for command execution.
room.on('playerChat', function (player, message) {
    if (message[0] === '!') {
        this.executeCommand(message.substr(1))
    }
})

// Define afk module.
const afkModule = {
    name: 'afk',
    callbacks: {
        playerAfkChange(player) {
            if (player.afk) this.sendChat(`${player.name} is afk`)
            else            this.sendChat(`${player.name} is not afk`)
        }
    },
    commands: [{
        names: ['afk'],
        execute(player, args) {
            // Toggle afk state.
            this.setPlayerAfk(player.id, !player.afk)
        }
    }, {
        names: ['afks', 'afklist'],
        execute(player, args) {
            const afkNames = this.getPlayerList().filter(p => p.afk).map(p => p.name)
            this.sendChat('Afk players: ' + afkNames.join(', '))
        }
    }]
}

// Register afk module.
room.registerModule(afkModule)
```

Module is registered! Now players can use two (or three) commands: `!afk` and `!afklist` (or `!afks`).


[Haxball Headless API]: https://github.com/haxball/haxball-issues/wiki/Headless-Host

[Haxball Headless API events]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#onplayerjoinplayer--playerobject--void
[Haxball Headless API methods]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#sendchatmessage--string-targetid--int--void

[Haxball Headless API room config]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#roomconfigobject
[Haxball Headless API player object]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#playerobject
