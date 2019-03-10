import { NativePlayer } from '../interfaces/NativePlayer';

const playerProps = 'id, name, team, admin, position'.split(', ')
export function isPlayerObject(obj: unknown): obj is NativePlayer {
    if (!obj || typeof obj !== 'object') return false
    for (const prop of playerProps) {
        if (!(prop in <object>obj)) return false
    }
    return true
}

export function _throw(err: any): never {
    throw err
}

export function capitalize(str: string): string {
    return str[0].toUpperCase() + str.substring(1)
}

export type ConstructorOf<T> = { new(...args: any[]): T }
export type Entries<T> = [keyof T, T[keyof T]][]
export type Keys<T> = (keyof T)[]
export type ArrayValuesType<T extends any[]> = T extends (infer U)[] ? U : never
export type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never


export type MetadataParamTypes<T = undefined> = undefined | (
    | T
    | typeof Number
    | typeof String
    | typeof Boolean
    | typeof Object
    | typeof Array
    | typeof Function
    | undefined
)[]

export * from './parseCommandString';
