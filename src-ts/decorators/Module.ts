import 'reflect-metadata';

function noop() { }
export function Module(): ClassDecorator {
    return noop
}
