export function parseCommandString(cmd: string): string[] {
    const args: string[] = []

    for (let i = 0; i < cmd.length; i++) {
        const token = cmd[i]
        let arg = ''
        if (token === "'" || token === '"') {
            // Read the string.
            i++
            for (let char = cmd[i]; char !== token && i < cmd.length; char = cmd[++i]) {
                if (char === '\\' && cmd[i + 1] === token)
                    char = cmd[++i]

                arg += char
            }

        } else {
            for (let char = cmd[i]; /\S/.test(char) && i < cmd.length; char = cmd[++i]) {
                arg += char
            }
        }
        if (arg !== '')
            args.push(arg)
    }

    return args
}
