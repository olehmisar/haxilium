import { BadAccessStringError } from '../errors';


const comparisonOperators = '>= > <= < == !='.split(' ')
const logicalOperators = '\\( \\) \\|\\| &&'.split(' ')
export function parseAccessString<TRoles extends { [role: string]: number }>(rawStr: string, roles: TRoles): (roles: (keyof TRoles)[]) => boolean {
    let str = rawStr.trim()

    if (str.length === 0)
        throw new BadAccessStringError(rawStr, 'String is empty')

    const allowedCharacters = Object.keys(roles)
        .concat(comparisonOperators)
        .concat(logicalOperators)

    if (str.replace(new RegExp(allowedCharacters.join('|'), 'g'), '').trim() !== '')
        throw new BadAccessStringError(rawStr,
            `Access string contains unallowed characters. Only "${allowedCharacters.join('", "')}" are allowed`)

    const roleArgName = '__role' + String(Math.random()).substring(2)
    str = str
        .replace(new RegExp(comparisonOperators.join('|'), 'g'), `${roleArgName}$&`)
        .replace(new RegExp(Object.keys(roles).join('|'), 'g'), roleName => String(roles[roleName]))

    let accessFunction: (role: TRoles[keyof TRoles]) => boolean
    try {
        accessFunction = new Function(roleArgName, `return Boolean(${str})`) as typeof accessFunction
    } catch (e) {
        throw new BadAccessStringError(rawStr, `Error in syntax`)
    }

    return function (roleNames) {
        for (let i = 0; i < roleNames.length; i++) {
            if (accessFunction(roles[roleNames[i]]))
                return true
        }
        return false
    }
}
