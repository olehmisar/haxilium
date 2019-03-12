import 'reflect-metadata';

function noop() { }
export function ModuleDecorator(): ClassDecorator {
    return noop
}
