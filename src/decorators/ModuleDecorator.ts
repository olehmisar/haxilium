import 'reflect-metadata';


export function ModuleDecorator(): ClassDecorator {
    return target => {
        Reflect.defineMetadata('haxball-room:ismodule', true, target)
    }
}
