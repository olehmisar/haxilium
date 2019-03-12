import 'reflect-metadata';
import { getModuleCommands } from './decorators/CommandDecorator';
import { getPropNamesWithEvents } from './decorators/EventDecorator';
import { DelegatedRoom } from './DelegatedRoom';
import { AccessToCommandDeniedError, UnknownCommandError } from './errors';
import { Module } from './interfaces/Module';
import { RoomConfig } from './interfaces/RoomConfig';
import { Command } from './models/Command';
import { Player } from './models/Player';
import { capitalize, ConstructorOf, MetadataParamTypes, parseAccessString, parseCommandString } from './utils';


export class Room<TPlayer extends Player, TRoles extends { [role: string]: number } = { [role: string]: number }> extends DelegatedRoom<TPlayer, TRoles> {
    private readonly modules: Module<TPlayer>[] = []
    private readonly commands: { [name: string]: Command<TPlayer, TRoles> } = {}
    private readonly roles: TRoles
    private readonly getRoles: NonNullable<RoomConfig<TPlayer, TRoles>['getRoles']>

    constructor(config: RoomConfig<TPlayer, TRoles>) {
        super(config)
        this.roles = config.roles || {} as TRoles
        this.getRoles = config.getRoles || (() => [])

        this.createModules(config.modules || [])
        this.createPlayerEvents()
    }

    dispatchEvent(event: string, args: any[]) {
        this.executeCallbacks('on' + capitalize(event), args)
    }

    executeCommand(player: TPlayer, cmd: string) {
        const args = parseCommandString(cmd)
        const name = args[0] = args[0].toLowerCase()

        const command = this.commands[name]
        if (!command)
            throw new UnknownCommandError(name)

        if (!command.hasAccess(this.getRoles(player)))
            throw new AccessToCommandDeniedError(name)

        return command.execute(player, args)
    }

    protected executeCallbacks(event: string, args: any[]) {
        const returns: any[] = []
        const modules = this.modules.concat([this])
        for (let i = 0; i < modules.length; i++) {
            const module = modules[i]
            try {
                if (module[event])
                    // TODO: remove type assertion.
                    returns.push((module[event] as (...args: any[]) => any)(...args))
            } catch (err) {
                console.error(err)
            }
        }

        if (returns.some(v => v === false)) return false
    }

    private createCommands(module: Module<TPlayer>, ModuleClass: ConstructorOf<Module<TPlayer>>) {
        const commands = getModuleCommands(ModuleClass)
        for (const [key, { names, access }] of commands) {
            // TODO: replace this with compile time check.
            if (names.length === 0)
                throw new TypeError(`Cannot create command in ${ModuleClass.name} module. command.names is an empty array`)

            const hasAccessFunc = access === undefined ? () => true : parseAccessString(access, this.roles)
            // TODO: remove type assertion.
            const command = new Command<TPlayer, TRoles>(names, hasAccessFunc, (module as any)[key].bind(module))
            for (const name of command.names) {
                if (this.commands[name])
                    throw new TypeError(`Cannot create command in ${ModuleClass.name} module. Command with ${name} name already exists`)

                this.commands[name] = command
            }
        }
    }

    private createPlayerEvents() {
        for (const [prop, event] of getPropNamesWithEvents(this.Player.prototype)) {
            const propSymbol = Symbol(prop)
            const room = this
            Object.defineProperty(this.Player.prototype, prop, {
                get() { return this[propSymbol] },
                set(value: any) {
                    if (this[propSymbol] !== value) {
                        this[propSymbol] = value
                        room.executeCallbacks(event, [this])
                    }
                }
            })
        }
    }

    private createModules(ModuleClasses: ConstructorOf<Module<TPlayer>>[]) {
        for (const ModuleClass of ModuleClasses) {
            this.createOrGetModule(ModuleClass)
        }
    }

    private createOrGetModule(ModuleClass: ConstructorOf<Module<TPlayer>>): Module<TPlayer> {
        let module = this.modules.find(module => module instanceof ModuleClass)
        if (module) return module

        const DependencyClasses: MetadataParamTypes<typeof Room | ConstructorOf<Module<TPlayer>>> = Reflect.getMetadata('design:paramtypes', ModuleClass)

        const dependencies: (Room<TPlayer> | Module<TPlayer>)[] = []
        for (const DependencyClass of DependencyClasses || []) {
            if (DependencyClass === Number ||
                DependencyClass === String ||
                DependencyClass === Boolean ||
                DependencyClass === Object ||
                DependencyClass === Array ||
                DependencyClass === Function ||
                DependencyClass === undefined
            ) {
                const name = DependencyClass ? DependencyClass.name : DependencyClass
                throw new TypeError(`Cannot inject ${name} because it is not a module`)

            } else if (DependencyClass === ModuleClass) {
                throw new TypeError(`Cannot inject the ${DependencyClass.name} module in itself`)

            } else if (DependencyClass === Room) {
                dependencies.push(this)

            } else {
                dependencies.push(this.createOrGetModule(DependencyClass))
            }
        }

        module = new ModuleClass(...dependencies)
        this.modules.push(module)

        this.createCommands(module, ModuleClass)

        return module
    }
}
