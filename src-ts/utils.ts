import { NativePlayer } from './interfaces/NativePlayer';

const playerProps = 'id, name, team, admin, position'.split(', ')
export function isPlayerObject(obj: unknown): obj is NativePlayer {
    if (!obj || typeof obj !== 'object') return false
    for (const prop of playerProps) {
        if (!(prop in <object>obj)) return false
    }
    return true
}

export type FilterOptions<T> = Partial<{ [K in keyof T]: T[K] }>
export type Entries<T> = [keyof T, T[keyof T]][]
export type Keys<T> = (keyof T)[]
export type ArrayValuesType<T extends any[]> = T extends (infer U)[] ? U : never
