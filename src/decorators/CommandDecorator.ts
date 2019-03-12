import 'reflect-metadata';
import { Module } from '../interfaces/Module';
import { Player } from '../models/Player';
import { ArrayValuesType, ConstructorOf } from '../utils';



export interface CommandOptions {
    readonly names: string[]
    readonly access?: string
}

export type CommandFunction<TPlayer extends Player> = (player: TPlayer, args: string[]) => any
type CommandMethodDescriptor<TPlayer extends Player> = TypedPropertyDescriptor<CommandFunction<TPlayer>>
type CommandMethodDecorator = <TPlayer extends Player>(target: Module<TPlayer>, key: string | symbol, descriptor: CommandMethodDescriptor<TPlayer>) => CommandMethodDescriptor<TPlayer> | void

export function CommandDecorator(name: string, access?: string): CommandMethodDecorator
export function CommandDecorator(names: string[], access?: string): CommandMethodDecorator
export function CommandDecorator(nameOrNames: string | string[], access?: string): CommandMethodDecorator {
    const names = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames]

    return (target, key) => {
        const commands: [string | symbol, CommandOptions][] | undefined = Reflect.getMetadata('haxball-room:commands', target)
        const command: ArrayValuesType<NonNullable<typeof commands>> = [key, { names, access }]
        if (commands) {
            commands.push(command)
        } else {
            Reflect.defineMetadata('haxball-room:commands', [command], target)
        }
    }
}

export function getModuleCommands<TPlayer extends Player>(ModuleClass: ConstructorOf<Module<TPlayer>>): [string | symbol, CommandOptions][] {
    return Reflect.getMetadata('haxball-room:commands', ModuleClass.prototype) || []
}
