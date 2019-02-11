import 'reflect-metadata';
import { DelegatedRoom } from './DelegatedRoom';
import { HaxballEvents } from './HaxballEvents';
import { Module, ModuleClass, PossibleModuleParameter } from './interfaces/Module';
import { RoomConfig } from './interfaces/RoomConfig';


export class Room extends DelegatedRoom {
    private modules: Module[] = []

    constructor(config: RoomConfig) {
        super(config)
        this.createModules(config.modules || [])
    }

    protected executeCallbacks<E extends keyof HaxballEvents>(event: E, args: Parameters<HaxballEvents[E]>) {
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

    private createModules(ModuleClasses: ModuleClass[]) {
        for (const ModuleClass of ModuleClasses) {
            this.createOrGetModule(ModuleClass)
        }
    }

    private createOrGetModule(ModuleClass: ModuleClass): Module {
        let module = this.modules.find(module => module instanceof ModuleClass)
        if (module) return module

        const DependencyClasses: PossibleModuleParameter[] | undefined = Reflect.getMetadata('design:paramtypes', ModuleClass)
        if (!DependencyClasses)
            throw new TypeError(`Cannot inject dependencies in the ${ModuleClass.name} because it is not decorated with proper decorator`)

        const dependencies: (Room | Module)[] = []
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
                dependencies.push(this.createOrGetModule(<ModuleClass>DependencyClass))
            }
        }

        module = new ModuleClass(...dependencies)
        this.modules.push(module)
        return module
    }

    private * getModules(): IterableIterator<Module> {
        yield* this.modules
        // TODO: remove type assertion.
        yield <Module><unknown>this
    }
}
