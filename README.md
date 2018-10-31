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
Haxilium is very similar to the [Haxball Headless API] because it is thin wrapper over it. That's why it is simple to get started.

### Create a room
Use `haxilium(config)` to create a room:
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

### Player object extension
<!-- TODO: describe player extension better. -->

We can extend player object if we pass `player` field to the config:
```js
import haxilium from 'haxilium'

const room = haxilium({
    roomName: 'Haxilium Room',
    playerName: 'Haxilium Bot',
    maxPlayers: 10,
    public: true,
    geo: { code: 'en', lat: 52, lon: 0 },

    // Define additional fields for player object.
    player: {
        // 'false' is the default value for 'afk'.
        afk: false
    }
})
```

In the above code we:
1. add `afk` property to the player object
2. attach `setPlayerAfk(playerID, value)` to the room object
3. create `playerAfkChange` event

So, we can make something like the following. We will catch player message and if it is "afk" then we will toggle his afk status. Don't use this code in your real project because there is a better solution using [commands](#add-commands).
```js
room.on('playerChat', function (player, message) {
    if (message === 'afk') {
        if (player.afk) {
            this.setPlayerAfk(player.id, false)
        } else
            this.setPlayerAfk(player.id, true)
        }
    }
})

room.on('playerAfkChange', function (player) {
    if (player.afk) this.sendChat(player.name + ' is afk')
    else            this.sendChat(player.name + ' is not afk')
})
```

### Attach callbacks
A `ready` event will be fired when room is ready to use. To attach callback to that event use `on(event, callbackFn)` method:
```js
room.on('ready', function () {
    console.log('Room is ready!')
})
```

__NOTE__ that event name is __not__ case-sensitive and is __not__ sensitive to different styles of cases. In other words, `player-join`, `PlayerJoin` and `playerJoin` is the same event. I recommend to use `camelCase` for event names and I will use it in the next sections.


Ok, let's add more callbacks. First one will greet user when he joins the room, second one will give him admin rights based on some condition:
```js
room.on('playerJoin', function (player) {
    // 'this' refers to the 'room' object. Don't use 'room' inside of callbacks, methods etc.
    this.sendChat('Welcome, ' + player.name)
})

room.on('playerJoin', function (player) {
    if (player.name === 'olegmisar') {
        this.setPlayerAdmin(player.id, true)
    }
})
```

__NOTE__ that registration __order__ of callbacks __matters__.

If name of player that enters the room is "olegmisar" room will do the following:
1. send "Hello, olegmisar" message
2. give him admin rights


Also we can pass an array of callbacks to register them in one go:
```js
function cb0() {
    console.log('cb0')
}

function cb1() {
    console.log('cb1')
}

const callbacks = [cb0, cb1]
room.on('playerJoin', callbacks)
```

When we don't want to use a callback anymore we can detach it:
```js
const detach = room.on('playerJoin', function (player) {
    console.log(player.name + ' has joined')
})

...

// Later in the code:
detach()
```

To see full list of events visit [this page][Haxball Headless API events].


### Create methods
Sometimes it is useful to define room related functions that we will use across entire project. It is logically correct to attach them to the room object. Use `method(name, methodFn)` to attach function to the room:
```js
room.method('sendChatPrefixed', function (prefix, message, playerID) {
    // 'this' refers to the 'room' object. Don't use 'room' inside of callbacks, methods etc.
    this.sendChat(prefix + ' ' + message, playerID)
})
```

Then we can use `sendChatPrefixed()`:
```js
room.on('playerChat', function (player, message) {
    if (message === 'get info') {
        // Sends "INFO: This is info message" to this player
        this.sendChatPrefixed('INFO:', 'This is info message', player.id)
    }
})
```


### Add commands
<!-- TODO: describe command making better. -->

Creating commands is very simple with Haxilium. Just use `addCommand(command)`. We will make command that adds two numbers provided by user. For example: `add 2 5` will send "2 + 5 = 7" to user. Now look at the code:
```js
room.addCommand({
    names: ['add'],
    execute(player, args) {
        // First argument is name of the command.
        // And rest arguments are arguments after name of the command.
        assert(args[0] === 'add')

        const a = Number(args[1])
        const b = Number(args[2])
        this.sendChat(`${a} + ${b} = ${a + b}`, player.id)
    }
})
```

Then we want users to execute this command. We use `executeCommand(player, command)` to do this:
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


## Module system
<!-- TODO: add 'defaultState' and 'methods' description -->

Haxilium provides module registration system. Module is an object which contains following fields: `defaultState`, `methods`, `callbacks` and `commands`. Let's look at a module which creates afk system:
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

// Register(bind) afk module.
room.bindModule(afkModule)
```

Module is binded! Now players can use two commands: `!afk` and `!afklist` (or `!afks`).


[Haxball Headless API]: https://github.com/haxball/haxball-issues/wiki/Headless-Host
[Haxball Headless API events]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#onplayerjoinplayer--playerobject--void
