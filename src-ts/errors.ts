export class UnknownCommandError {
    constructor(readonly commandName: string) { }
    toString() {
        return `Unknown command ${this.commandName}`
    }
}
