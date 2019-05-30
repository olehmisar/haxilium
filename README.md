# Haxilium

> __WARNING. This npm package is written in TypeScript. If you want to use an older version which is written in JavaScript run__ `npm install haxilium@0.7.1`

Haxball Headless API Framework for easy and organized development. Haxilium requires TypeScript to work. This provides strict type checking and helps to avoid a lot of bugs on compile time.

```ts
import haxilium, { Player } from 'haxilium'

const room = haxilium({ roomName: 'Haxilium Room' })

room.onPlayerJoin = function (player: Player) {
    room.sendChat(`Hello, ${player.name}!`)
}
```

# Installation

Use the following command to install Haxilium:

```shell
npm install haxilium
```

That's all!

# Getting started

Haxilium provides the same API as [Haxball Headless API] but also adds modules and custom `Player` models.

## Create a room

Use `haxilium(config: RoomConfig)` to create a room:

```ts
import haxilium from 'haxilium'

const room = haxilium({
    roomName: 'Haxilium Room',
    playerName: 'Haxilium Bot',
    maxPlayers: 10,
    public: true,
    geo: { code: 'en', lat: 52, lon: 0 }
})
```

The above code will create a __public__ haxball room with "__Haxilium Room__" name, "__Haxilium Bot__" player(bot) name, the maximum amount of players of __10__ and with geolocation of __England__.

## `RoomConfig`

`RoomConfig` is the same as in [Haxball Headless API]. You can look at the description of room config [here][Haxball Headless API room config].

## Custom `Player` model

In addition, Haxilium provides more `RoomConfig` properties:

- `Player` - class which extends `haxilium.Player` class. To fire events when any player's field is changed, you have to decorate it with `Event(event: string)` decorator
- `roles` - an object of roles. E.g., `{ ingame: 0, moderator: 1, admin: 2 }`
- `getRoles(player: Player)` - a function which returns an array of strings: all `roles` of the `player`

You will need roles to limit access to specific commands. Command creation will be explained later.

Example:

```ts
import haxilium, { Event, Team, Player as PlayerBase } from 'haxilium'

class Player extends PlayerBase {
    @Event('playerCustomFieldChange') customField = false
}

const room = haxilium({
    Player: Player,
    roles: { customRole: 0, ingame: 1, admin: 2 },
    getRoles: (player: Player) => [
        player.admin ? 'admin' : '',
        player.team !== Team.Spect ? 'ingame' : '',
        player.customField ? 'customRole': '',
    ]
})

room.onPlayerJoin = function (player: Player) {
    // This line of code will fire 'playerCustomFieldChange' event.
    player.customField = true
}

room.onPlayerCustomFieldChange = function (player: Player) {
    console.log('player.customField was changed')
}
```

## Attach callbacks

[Full list of events][Haxball Headless API events]

To attach a callback to, for example, `playerJoin` event, use the following code:

```ts
room.onPlayerJoin = function (player: Player) {
    console.log(player.name + ' has joined')
}
```

When you don't want to use the callback anymore you can `delete` it or set it to any falsy value:

```ts
// Recommended.
delete room.onPlayerJoin
// This is NOT recommended.
room.onPlayerJoin = null
room.onPlayerJoin = undefined
room.onPlayerJoin = false
room.onPlayerJoin = 0
room.onPlayerJoin = ''
```

To see a full list of events visit [this page][Haxball Headless API events].

## Custom events

To fire a custom event, use `Room.dispatchEvent(event: string, args: any[])`:

```ts
const room = haxilium({ ... })
room.onPlayerJoin = function (player: Player) {
    room.dispatchEvent('customPlayerJoin', ['Hello there'])
}

room.onCustomPlayerJoin = function (message: string) {
    // message is "Hello there"
    console.log(message)
}
```

## Improved `Room.getPlayerList()`

There are 3 improvements in `Room.getPlayerList()` method:

1. It will never return player with ID = 0. In other words, it will never return host player
2. You can sort players by team by passing an array of team IDs as first argument:

    ```ts
    // Team.Red, Team.Blue and Team.Spect are 1, 2, 0 respectively.
    const teams = room.getPlayerList([Team.Red, Team.Blue, Team.Spect])
    const red = teams[0]
    const blue = teams[1]
    const spect = teams[2]
    ```

    Or use ES6 destructuring assignment:

    ```ts
    const [red, blue, spect] = room.getPlayerList([Team.Red, Team.Blue, Team.Spect])
    ```

    In result, `red` will contain only players from red team, `blue` will contain only players from blue team and `spect` will contain only spectators.
3. You can filter out players by passing filter object as first argument(or second argument if you also want to sort players by team):

    ```ts
    const admins = room.getPlayerList({ admin: true })
    const [redAdmins, blueAdmins] = room.getPlayerList([Team.Red, Team.Blue], { admin: true })
    ```

<!--
## Add commands
TODO: describe command making better.

Creating commands is very simple with Haxilium. Just use `addCommand(command: CommandObject)`. `CommandObject` has only 3 properties:
- `names: string[]` - names of command
- `execute(player: PlayerObject, args: string[]): function` - the command function itself. Accepts `PlayerObject` who executes command as first parameter and `args` array as second parameter
- `access: string` - boolean expression which determines if player can or cannot execute this command. Optional. [More info](#player-roles)

We will make command that adds two numbers provided by a player. For example: `add 2 5` will send `'2 + 5 = 7'` message to the player. Now let's look at the code:
```ts
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
```ts
room.on('playerChat', function (player, message) {
    if (message[0] === '!') {
        // Remove '!' symbol.
        const command = message.substring(1, message.length)
        this.executeCommand(player, command)
    }
})
```

__NOTE__ that we pass a `string` to the `executeCommand(player, command)`. For example: `executeCommand(player, 'add 2 5')`. After that, the command will be parsed and passed to the `execute(player, args)` function. `args` is an __array of strings__. First argument `args[0]` is the name of the command. In our case, `args[0] === 'add'`, `args[1] === '2'` and `args[2] === '5'`.


## Player roles
When we are going to make a big project, we want to make roles for players. For example, we don't want `!kick` command to be available for every player but only for admins. So, we introduce roles in our project. All roles are specified in config under the `roles` field and are an array similar to this: `['player', 'admin']`. Roles array is a hierarchy where roles that have smaller index are lower in the hierarchy table. In our array `'player'` < `'admin'` because `'player'` has smaller index than `'admin'` in `['player', 'admin']` array. To calculate role for every player we specify `getRole(player: PlayerObject)` in config:
```ts
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
```ts
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


## Get commands
It is useful to retrieve commands when we need them. For example, we are going to make a user-friendly bot that has `!help` command in it. We use `getCommand(name: string)` to get command by name and `getCommands(filterFn: function)` to get all commands which match `filterFn` function:
```ts
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

Now, if the player types `!help afk` in chat, he will get `'Toggle your afk status'` help message. And when he writes just `!help` command he will get a full list of commands which provide help messages. -->

# Module system

## Introduction

A module is a class which is decorated with `Module()` decorator and it defines callbacks and commands as its methods:

```ts
import { Module, Player } from 'haxilium'

@Module()
class LoggingModule {
    private logs: string[] = []

    onPlayerJoin(player: Player) {
        this.logs.push(`${player.name} has joined`)
    }

    onPlayerLeave(player: Player) {
        this.logs.push(`${player.name} has left`)
    }
}
```

Then you pass all your modules to the `modules` field in the `RoomConfig`:

```ts
const room = haxilium({
    roomName: 'Room with modules',
    modules: [LoggingModule]
})
```

You can also define methods, fields and other stuff in the module class but I recommend not to use names which start with `on` to avoid collisions with callbacks.

## Access room in a module

To access the room object in the module, you have to define a constructor, which accepts a `Room` argument:

```ts
import { Module, Room, Player } from 'haxilium'

@Module()
class GreetingModule {
    private $: Room

    constructor($: Room) {
        this.$ = $
    }

    onPlayerJoin(player: Player) {
        this.$.sendChat(`Welcome, ${player.name}!`)
    }
}
```

Notice that

```ts
private $: Room

constructor($: Room) {
    this.$ = $
}
```

can be rewritten as

```ts
constructor(private $: Room) { }
```

So the final version of `GreetingModule` will be:

```ts
import { Module, Room, Player } from 'haxilium'

@Module()
class GreetingModule {
    constructor(private $: Room) { }

    onPlayerJoin(player: Player) {
        this.$.sendChat(`Welcome, ${player.name}!`)
    }
}
```

If you want to use a custom player in your module, you have to pass the `Player` to the `Room` type annotation:

```ts
// Player.ts
import { Player as PlayerBase } from 'haxilium'

export class Player extends PlayerBase {
    customField = false
}

// index.ts
import { Module, Room } from 'haxilium'
import { Player } from './Player.ts'


@Module()
class GreetingModule {
    // Here is the change.
    constructor(private $: Room<Player>) { }

    onPlayerJoin(player: Player) {
        this.$.sendChat(`Welcome, ${player.name}!`)
    }
}
```

## Dependency injection

Sometimes, a module can require other modules as its dependencies. For example, `NotifierModule` can require `PrettyChatModule`. It is not good to create modules by hand:

```ts
@Module()
class PrettyChatModule {
    constructor(private $: Room) { }
    sendChatPretty(message: string) {
        const prettyMessage = prettify(message)
        this.$.sendChat(message)
    }
}

@Module()
class NotifierModule {
    constructor(private $: Room) { }
    notifyPlayers() {
        // Here I want to use `PrettyChatModule.sendChatPretty()`.
        // DON'T DO THIS. It is just for demonstration purposes.
        // The right way of requiring `PrettyChatModule` is explained down there.
        const prettyChat = new PrettyChatModule(this.$)
        prettyChat.sendChatPretty('Some notification message')
    }
}
```

The above way of requiring another module as a dependency is bad because if we want to use the same dependency in two different modules we have to create a lot of instances of the same dependency:

```ts
@Module() class Dep { someDepMethod() { } }
@Module() class A {
    someMethod() {
        // First instance.
        new Dep().someDepMethod()
    }
}
@Module() class B {
    someMethod() {
        // Second instance.
        new Dep().someDepMethod()
    }
}
```

That's why Haxilium provides dependency injection (DI) for modules. To require a module, declare a constructor, which accepts that module as a parameter(like `private $: Room`):

```ts
@Module()
class PrettyChatModule {
    constructor(private $: Room) { }
    sendChatPretty(message: string) {
        const prettyMessage = prettify(message)
        this.$.sendChat(message)
    }
}

@Module()
class NotifierModule {
    // Define it here.
    constructor(private prettyChat: PrettyChatModule) { }
    notifyPlayers() {
        // Use everywhere in the module.
        this.prettyChat.sendChatPretty('Some notification message')
    }
}
```

This way of requiring modules as dependencies will guarantee that every module is created only __once__.

## Add command

To add a command, decorate a method with `Command(names: string|string[])` decorator. The method must accept two parameters:

- `player: Player` - a player who executes the command
- `args: string[]` - an array of arguments

Example:

```ts
import { Module, Command, Player, Room } from 'haxilium'

@Module()
class LoggingModule {
    private logs: string[] = []

    constructor(private $: Room) { }

    onPlayerJoin(player: Player) {
        this.logs.push(`${player.name} has joined`)
    }

    onPlayerLeave(player: Player) {
        this.logs.push(`${player.name} has left`)
    }

    @Command('printlogs')
    pringLogs(player: Player, args: string[]) {
        const len = parseInt(args[1]) || 5
        const latestLogs = this.logs.slice().reverse().slice(0, len)
        for (const log of latestLogs) {
            this.$.sendChat(log, player.id)
        }
    }
}
```

The above command will send `len` latest logs to the chat.

Also, you can define more than one name for a command:

```ts
@Module()
class LoggingModule {
    ...

    @Command(['printlogs', 'getlogs'])
    pringLogs(player: Player, args: string[]) { ... }

    ...
}
```

Names of commands are case insensitive: `kick`, `Kick` and `KiCK` are equal.

## Execute a command

To execute command, use `Room.executeCommand(player: Player, command: string)`. Command will be parsed and passed to the appropriative method. Examples of parsed commans:

- `printlogs 1` => `['printlogs', '1']`
- `printlogs 1 2` => `['printlogs', '1', '2']`
- `printlogs "1 2"` => `['printlogs', '1 2']`
- `printlogs "1 \" 2"` => `['printlogs', '1 " 2']`

As you can see, the name of the command is always the first argument.

Now, use `Room.executeCommand()`. A message which starts with `!` will be interpreted as a command:

```ts
room.onPlayerChat = function (player: Player, message: string) {
    if (message[0] === '!') {
        // Remove the leading '!'.
        const command = message.substring(1)
        return room.executeCommand(player, command)
    }
}
```

If a command does not exist, `UnknownCommandError` will be thrown, so it is good to catch that error:

```ts
import { UnknownCommandError } from 'haxilium'

room.onPlayerChat = function (player: Player, message: string) {
    if (message[0] === '!') {
        // Remove the leading '!'.
        const command = message.substring(1)
        try {
            return room.executeCommand(player, command)
        } catch (err) {
            if (err instanceof UnknownCommandError) {
                // Notify player that command does not exist.
                room.sendChat(err.message, player.id)
            } else {
                // Rethrow it.
                throw err
            }
        }
    }
}
```

## Limit access to the command

Often you want to limit access for specific commands. For example, only admins can kick players. So, you have to define roles and which player belongs to each role and then pass a second argument (boolean expression string) to the `Command()` decorator:

```ts
import haxilium, { Module, Command, Room, Player } from 'haxilium'

@Module()
class KickModule {
    constructor(private $: Room) { }

    @Command('kick', '>=admin')
    kickPlayer(byPlayer: Player, args: stirng[]) {
        const id = parseInt(args[1])
        const reason = args[2]
        this.$.kickPlayer(id, reason)
        const kickedPlayer = this.$.getPlayer(id)
        this.$.sendChat(`${kickedPlayer.name} was kicked by ${byPlayer.name}`)
    }
}

const room = haxilium({
    roles: { ingame: 0, admin: 1 }
    getRoles: (player: Player) => [
        player.admin ? 'admin' : '',
        player.team !== Team.Spect ? 'ingame' : '',
    ],
    modules: [KickModule],
})
```

Now, `kick` command will be available only to players who belong to `admin` role. Usage:

- `kick 1` - kick a player with id `1`
- `kick 1 "very long afk"` - kick a player with id `1` and specify "very long afk" reason

A second parameter of the `@Command()` decorator is a string which is a boolean expression. Available operators:

- `==`, `!=`
- `>`, `>=`
- `<`, `<=`
- `||`, `&&`
- `()`  - parenthesis

For example:

- `>ingame && <admin` will allow command execution only for players whose role is __greater than__ `ingame` __AND less than__ `admin`
- `<ingame || >admin` will allow command execution only for players whose role is __less than__ `ingame` __OR greater than__ `admin`.
- `<ingame || (>ingame && <admin)` will allow command execution only for players whose role is either
    - __less than__ `ingame` __OR__
    - __greater than__ `ingame` __AND less than__ `admin`

If a player does not have enough rights to execute a command, `AccessToCommandDeniedError` will be thrown. It is good to handle this:

```ts
import { UnknownCommandError, AccessToCommandDeniedError } from 'haxilium'

room.onPlayerChat = function (player: Player, message: string) {
    if (message[0] === '!') {
        // Remove the leading '!'.
        const command = message.substring(1)
        try {
            return room.executeCommand(player, command)
        } catch (err) {
            if (err instanceof UnknownCommandError) {
                // Notify player that command does not exist.
                room.sendChat(err.message, player.id)
            } else if (err instanceof AccessToCommandDeniedError) {
                // Notify player that he does not have rights to execute this command.
                room.sendChat("You don't have enough rights to execute this command", player.id)
            } else {
                // Rethrow it.
                throw err
            }
        }
    }
}
```

## Meta information about a command

Sometimes, there are situations when you want to store some additional information about a command. For example, you want to make a `help` command, which shows players a `description` of each command. To store meta information about the command, pass it as the third argument to the `Command()` decorator and later retrieve it using `Room.getCommandMeta(name: string)`:

```ts
@Module()
class CommandsModule {
    constructor(private $: Room) { }

    // Access string can be empty if you want the command to be accessible to any player.
    @Command('leave', '', {
        description: 'Leave the room'
    })
    makePlayerLeave(player: Player, args: string[]) {
        this.$.kickPlayer(player.id, 'Bye!')
    }

    @Command('help', '', {
        description: 'Use `help <command>` to get help for specific <command>'
    })
    getHelp(player: Player, args: string[]) {
        const commandName = (args[1] || '').toLowerCase()
        const meta = this.$.getCommandMeta(commandName)
        if (meta && meta.description) {
            this.$.sendChat(meta.description)
        } else {
            this.$.sendChat(`Help for "${commandName}" command is unavailable`)
        }
    }
}
```

Command meta has `any` type. It's your responsibility to check its type when you try to read it.

## Afk module example

Below you can see an example of an afk module:

```ts
import haxilium, { Module, Command, Event, Room, Player as PlayerBase } from 'haxilium'

class Player extends PlayerBase {
    @Event('playerAfkChange') afk = false
}

@Module()
class AfkModule {
    constructor(private $: Room<Player>) { }

    @Command('afk')
    setAfk(player: Player, args: string[]) {
        player.afk = true
    }

    @Command(['back', 'here', 'notafk'])
    unsetAfk(player: Player, args: string[]) {
        player.afk = false
    }

    onPlayerAfkChange(player: Player) {
        if (player.afk) this.$.sendChat(`${player.name} is afk`)
        else            this.$.sendChat(`${player.name} is not afk`)
    }
}

const room = haxilium({
    roomName: 'Room with afk command',
    Player: Player,
    modules: [AfkModule],
})

// Execute command
room.onPlayerChat = function (player: Player, message: string) {
    if (message[0] === '!') {
        const command = message.substring(1)
        try {
            return room.executeCommand(player, command)
        } catch (err) {
            if (err instanceof UnknownCommandError) {
                room.sendChat(err.message, player.id)
            } else if (err instanceof AccessToCommandDeniedError) {
                room.sendChat("You don't have enough rights to execute this command", player.id)
            } else {
                throw err
            }
        }
    }
}
```

[Haxball Headless API]: https://github.com/haxball/haxball-issues/wiki/Headless-Host

[Haxball Headless API events]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#onplayerjoinplayer--playerobject--void
[Haxball Headless API methods]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#sendchatmessage--string-targetid--int--void

[Haxball Headless API room config]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#roomconfigobject
[Haxball Headless API player object]: https://github.com/haxball/haxball-issues/wiki/Headless-Host#playerobject
