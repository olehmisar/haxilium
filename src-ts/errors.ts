export class UnknownCommandError extends Error {
    constructor(commandName: string) {
        super(`Unknown command ${commandName}`)
    }
}
