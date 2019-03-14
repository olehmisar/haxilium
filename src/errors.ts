class MyError {
    constructor(public message: string) { }
}

export class UnknownCommandError extends MyError {
    constructor(commandName: string) {
        super(`Unknown command ${commandName}`)
    }
}

export class AccessToCommandDeniedError extends MyError {
    constructor(commandName: string) {
        super(`You don't have access to ${commandName} command`)
    }
}

export class BadAccessStringError extends MyError {
    constructor(accessString: string, reason: string) {
        super(`Bad access string "${accessString}". ${reason}`)
    }
}
