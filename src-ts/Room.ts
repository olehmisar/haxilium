import 'reflect-metadata';
import { DelegatedRoom } from './DelegatedRoom';
import { RoomConfig } from './interfaces/RoomConfig';
import { Module } from './models/Module';


export class Room extends DelegatedRoom {
    private modules: Module[] = []

    constructor(config: RoomConfig) {
        super(config)
        for (const ModuleClass of config.modules || []) {
            this.initializeOrGetModule(ModuleClass, this.modules)
        }
    }

    private initializeOrGetModule(ModuleClass: { new(...args: any[]): Module }, modules: Module[]): Module {
        let module = modules.find(module => module instanceof ModuleClass)
        if (module) return module

        const DependencyClasses = Reflect.getMetadata('design:paramtypes', ModuleClass)
        if (!DependencyClasses)
            throw new TypeError(`Cannot inject dependencies in the ${ModuleClass.name} because it is not decorated with proper decorator`)

        const dependencies = []
        for (const DependencyClass of DependencyClasses) {
            if ([Number, String, Boolean, Object, undefined, Array].includes(DependencyClass))
                throw new TypeError(`Cannot inject ${DependencyClass} because it is not a module`)
            if (DependencyClass === ModuleClass)
                throw new TypeError(`Cannot inject the ${DependencyClass.name} module in itself`)

            if (DependencyClass === Room) {
                dependencies.push(this)
            } else {
                dependencies.push(this.initializeOrGetModule(DependencyClass, modules))
            }
        }

        module = new ModuleClass(...dependencies)
        modules.push(module)
        return module
    }

    protected executeCallbacks(event: string, args: any[]) {
        for (const module of this.modules) {
            if ((<any>module)[event]) {
                ; ((<any>module)[event])(...args)
            }
        }
    }
}
