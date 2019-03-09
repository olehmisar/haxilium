import 'reflect-metadata';
import { getPropNamesWithEvents } from './decorators/Event';
import { DelegatedRoom } from './DelegatedRoom';
import { Module } from './interfaces/Module';
import { RoomConfig } from './interfaces/RoomConfig';
import { Player } from './models/Player';
import { capitalize, ConstructorOf, MetadataParamTypes } from './utils';


export class Room<TPlayer extends Player> extends DelegatedRoom<TPlayer> {
    private modules: Module[] = []

    constructor(config: RoomConfig<TPlayer>) {
        super(config)
        this.createModules(config.modules || [])
        this.createPlayerEvents()
    }

    dispatchEvent(event: string, args: any[]) {
        this.executeCallbacks('on' + capitalize(event), args)
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
        return module
    }
}
