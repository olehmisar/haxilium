import _ from 'lodash'
import assert from 'assert'
import setImmediate from 'set-immediate-shim'


const playerProps = 'id, name, team, admin, position'.split(', ')
export function isPlayerObject(obj) {
    if (!_.isObject(obj)) return false
    for (let prop of playerProps) {
        if (!(prop in obj)) return false
    }
    return true
}
window.parseAccessStringWithRoles = parseAccessStringWithRoles
export function parseAccessStringWithRoles(rawStr, roles) {
    let str = rawStr.trim()

    assert(!_.isEmpty(str), `Invalid 'access' string ${rawStr}`)
    assert(!_.isEmpty(roles), `Invalid player's roles ${_.keys(roles)}`)

    const wrapWithParenthesis = val => `(${val})`

    const rolesKeys = _.keys(roles)
    const comparationOperators = ['>=', '>', '<=', '<', '==', '==='].map(_.escapeRegExp)
    const allWordsRegExp = new RegExp(
        ['(', ')', '||', '&&'].map(_.escapeRegExp)
            .concat(comparationOperators)
            .concat(rolesKeys)
            .map(wrapWithParenthesis)
            .join('|'),
        'g')

    // If string contains chars that are not listed in above regexp
    // then this string contains bad characters.
    assert(str.replace(allWordsRegExp, '').trim() === '', `Invalid 'access' string ${rawStr}. Use only allowed characters to make 'access' string`)

    const comparationOperatorsRegExp = new RegExp(
        comparationOperators.map(wrapWithParenthesis).join('|'),
        'g')
    str = str.replace(comparationOperatorsRegExp, '_role$&')

    const rolesRegExp = new RegExp(
        rolesKeys.map(wrapWithParenthesis).join('|'),
        'g')
    str = str.replace(rolesRegExp, roleName => roles[roleName])

    const functionBody = 'return Boolean(' + str + ')'
    try {
        return new Function('_role', functionBody)
    } catch (e) {
        throw new Error(`Invalid 'access' string ${rawStr}. Use only allowed characters to make 'access' string`)
    }
}

export function asyncify(fn) {
    return (...args) =>
        void setImmediate(() => fn(...args))
}

export function createEnum(keys) {
    return keys.reduce((result, key, value) => ({
        ...result,
        [key]: value
    }), {})
}
