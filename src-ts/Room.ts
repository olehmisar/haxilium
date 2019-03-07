import 'reflect-metadata';
import { DelegatedRoom } from './DelegatedRoom';
import { HaxballEvents } from './HaxballEvents';
import { Module } from './interfaces/Module';
import { RoomConfig } from './interfaces/RoomConfig';
import { Player } from './models/Player';
import { ConstructorOf, MetadataParamTypes } from './utils';


export class Room<TPlayer extends Player> extends DelegatedRoom<TPlayer> {
    private modules: Module<TPlayer>[] = []

    constructor(config: RoomConfig<TPlayer>) {
        super(config)
        this.createModules(config.modules || [])
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

    private createModules(ModuleClasses: Array<ConstructorOf<Module<TPlayer>>>) {
        for (const ModuleClass of ModuleClasses) {
            this.createOrGetModule(ModuleClass)
        }
    }

    private createOrGetModule(ModuleClass: ConstructorOf<Module<TPlayer>>): Module<TPlayer> {
        let module = this.modules.find(module => module instanceof ModuleClass)
        if (module) return module

        const DependencyClasses: MetadataParamTypes<typeof Room | ConstructorOf<Module<TPlayer>>> = Reflect.getMetadata('design:paramtypes', ModuleClass)

        if (!DependencyClasses)
            throw new TypeError(`Cannot inject dependencies in the ${ModuleClass.name} because it is not decorated with proper decorator`)

        const dependencies: (Room<TPlayer> | Module<TPlayer>)[] = []
        for (const DependencyClass of DependencyClasses) {
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
                dependencies.push(this.createOrGetModule(DependencyClass as ConstructorOf<Module<TPlayer>>))
            }
        }

        module = new ModuleClass(...dependencies)
        this.modules.push(module)
        return module
    }

    private * getModules(): IterableIterator<Module<TPlayer>> {
        yield* this.modules
        yield this
    }
}
