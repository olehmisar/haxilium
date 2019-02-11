import 'reflect-metadata';


// TODO: use Symbol, not string
const metadataKey = 'properties-with-events'//Symbol(`room-events`)
type PropKeyWithEvent = [string, string]

export function Event(event: string): PropertyDecorator {
    return (target: Object, propKey: string | symbol) => {
        if (typeof propKey === 'symbol')
            throw new TypeError("Decorator 'Event' cannot decorate a property with Symbol key")

        const propsWithEvents = Reflect.getMetadata(metadataKey, target)
        const data: PropKeyWithEvent = [propKey, event]
        if (propsWithEvents) {
            propsWithEvents.push(data)
        } else {
            Reflect.defineMetadata(metadataKey, [data], target)
        }
    }
}

export function getPropKeysWithEvents(target: Object): PropKeyWithEvent[] {
    return <PropKeyWithEvent[]>Reflect.getMetadata(metadataKey, target) || []
}
