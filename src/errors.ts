export class UnknownCommandError extends Error {
    constructor(commandName: string) {
        super(`Unknown command ${commandName}`)
    }
}

export class AccessToCommandDeniedError extends Error {
    constructor(commandName: string) {
        super(`You don't have access to ${commandName} command`)
    }
}

export class BadAccessStringError extends Error {
    constructor(accessString: string, reason: string) {
        super(`Bad access string "${accessString}". ${reason}`)
    }
}
