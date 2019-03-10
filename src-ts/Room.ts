import 'reflect-metadata';
import { getModuleCommands } from './decorators/CommandDecorator';
import { getPropNamesWithEvents } from './decorators/Event';
import { DelegatedRoom } from './DelegatedRoom';
import { UnknownCommandError } from './errors';
import { Module } from './interfaces/Module';
import { RoomConfig } from './interfaces/RoomConfig';
import { Player } from './models/Player';
import { capitalize, ConstructorOf, MetadataParamTypes, parseCommandString } from './utils';


export class Room<TPlayer extends Player> extends DelegatedRoom<TPlayer> {
    private modules: Module[] = []
    private commandLookup: { [name: string]: (player: TPlayer, args: string[]) => any } = {}

    constructor(config: RoomConfig<TPlayer>) {
        super(config)
        this.createModules(config.modules || [])
        this.createPlayerEvents()
    }

    dispatchEvent(event: string, args: any[]) {
        this.executeCallbacks('on' + capitalize(event), args)
    }

    executeCommand(player: TPlayer, cmd: string) {
        const args = parseCommandString(cmd)
        const name = args[0] = args[0].toLowerCase()

        const command = this.commandLookup[name]
        if (!command)
            throw new UnknownCommandError(name)

        command(player, args)
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

    private createCommands(module: Module, ModuleClass: ConstructorOf<Module>) {
        const commands = getModuleCommands(ModuleClass)
        for (const [key, { names }] of commands) {
            if (names.length === 0)
                throw new TypeError(`Cannot create command in ${ModuleClass.name} module. command.names is an empty array`)

            for (let name of names) {
                name = name.toLowerCase()
                if (this.commandLookup[name])
                    throw new TypeError(`Cannot create command in ${ModuleClass.name} module. Command with ${name} name already exists`)

                // TODO: remove type assertion.
                this.commandLookup[name] = (<any>module)[key].bind(module)
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

    private createModules(ModuleClasses: ConstructorOf<Module>[]) {
        for (const ModuleClass of ModuleClasses) {
            this.createOrGetModule(ModuleClass)
        }
    }

    private createOrGetModule(ModuleClass: ConstructorOf<Module>): Module {
        let module = this.modules.find(module => module instanceof ModuleClass)
        if (module) return module

        const DependencyClasses: MetadataParamTypes<typeof Room | ConstructorOf<Module>> = Reflect.getMetadata('design:paramtypes', ModuleClass)

        const dependencies: (Room<TPlayer> | Module)[] = []
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
