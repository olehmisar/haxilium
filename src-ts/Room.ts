import 'reflect-metadata';
import { getPropNamesWithEvents } from './decorators/Event';
import { DelegatedRoom } from './DelegatedRoom';
import { RoomConfig } from './interfaces/RoomConfig';
import { HaxballEvents } from './models/HaxballEvents';
import { Player } from './models/Player';
import { ConstructorOf, MetadataParamTypes } from './utils';


export class Room<TPlayer extends Player> extends DelegatedRoom<TPlayer> {
    private modules: object[] = []

    constructor(config: RoomConfig<TPlayer>) {
        super(config)
        this.createModules(config.modules || [])
        this.createPlayerEvents()
    }

    protected executeCallbacks<E extends keyof HaxballEvents<TPlayer>>(event: E, args: Parameters<HaxballEvents<TPlayer>[E]>) {
        for (const module of this.getModules()) {
            try {
                // TODO: remove type assertion.
                if (module[event])
                    (<any>module[event])(...args)
            } catch (err) {
                console.error(err)
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
                        // TODO: remove type assertion.
                        setTimeout(() => room.executeCallbacks(event as any, [this]), 0)
                    }
                }
            })
        }
    }

    private createModules(ModuleClasses: ConstructorOf<object>[]) {
        for (const ModuleClass of ModuleClasses) {
            this.createOrGetModule(ModuleClass)
        }
    }

    private createOrGetModule(ModuleClass: ConstructorOf<object>): object {
        let module = this.modules.find(module => module instanceof ModuleClass)
        if (module) return module

        const DependencyClasses: MetadataParamTypes<typeof Room | ConstructorOf<object>> = Reflect.getMetadata('design:paramtypes', ModuleClass)

        const dependencies: (Room<TPlayer> | object)[] = []
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
                // TODO: remove type assertion
                dependencies.push(this.createOrGetModule(DependencyClass as ConstructorOf<object>))
            }
        }

        module = new ModuleClass(...dependencies)
        this.modules.push(module)
        return module
    }

    private * getModules(): IterableIterator<any> {
        yield* this.modules
        yield this
    }
}
