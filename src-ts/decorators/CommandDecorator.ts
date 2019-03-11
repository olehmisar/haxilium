import 'reflect-metadata';
import { Module } from '../interfaces/Module';
import { Player } from '../models/Player';
import { ConstructorOf } from '../utils';


interface CommandDecoratorOptions {
    readonly names: string[]
}

export function CommandDecorator(name: string): MethodDecorator
export function CommandDecorator(names: string[]): MethodDecorator
export function CommandDecorator(nameOrNames: string | string[]): MethodDecorator {
    const names = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames]

    return (target, key) => {
        const commands: [string | symbol, CommandDecoratorOptions][] | undefined = Reflect.getMetadata('haxball-room:commands', target)
        const data: [string | symbol, CommandDecoratorOptions] = [key, { names }]
        if (commands) {
            commands.push(data)
        } else {
            Reflect.defineMetadata('haxball-room:commands', [data], target)
        }
    }
}

export function getModuleCommands<TPlayer extends Player>(ModuleClass: ConstructorOf<Module<TPlayer>>): [string | symbol, CommandDecoratorOptions][] {
    return Reflect.getMetadata('haxball-room:commands', ModuleClass.prototype) || []
}
