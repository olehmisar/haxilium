import 'reflect-metadata';
import { capitalize } from '../utils';

// TODO: replace Symbol with string literals
const metadataKey = Symbol(`room:events`)
type PropNameWithEvent = [string, string]

export function Event(event: string): PropertyDecorator {
    return (target: object, propName: string | symbol) => {
        if (typeof propName === 'symbol')
            throw new TypeError("Decorator 'Event' cannot decorate a property with Symbol key")

        if (Object.getOwnPropertyDescriptor(target, propName))
            throw new TypeError("Cannot decorate method or get-set with 'Event' decorator")


        const propsWithEvents: PropNameWithEvent[] | undefined = Reflect.getMetadata(metadataKey, target)
        const data: PropNameWithEvent = [propName, 'on' + capitalize(event)]
        if (propsWithEvents) {
            propsWithEvents.push(data)
        } else {
            Reflect.defineMetadata(metadataKey, [data], target)
        }
    }
}

export function getPropNamesWithEvents(target: object): PropNameWithEvent[] {
    return Reflect.getMetadata(metadataKey, target) || []
}
