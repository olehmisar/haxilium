import _ from 'lodash'
import assert from 'assert'


const playerProps = 'id, name, team, admin, position'.split(', ')
export function isPlayerObject(obj) {
    if (!_.isObject(obj)) return false
    for (let prop of playerProps) {
        if (!(prop in obj)) return false
    }
    return true
}

export function parseAccessStrings(strings) {
    const fns = strings.map(str => {
        str = _.toString(str)
        const access = str.match(/^((?:>|<)?=?)(-?\d+)$/)
        assert(_.isArray(access), 'Invalid access condition string')

        const condition = access[1] || '>='
        const level = parseInt(access[2])
        assert(['>', '<', '>=', '<=', '='].includes(condition), 'Invalid access condition string')
        switch (condition) {
            case '>':  return rights => rights >   level
            case '<':  return rights => rights <   level
            case '>=': return rights => rights >=  level
            case '<=': return rights => rights <=  level
            case '=':  return rights => rights === level
        }
    })
    return rights => fns.every(fn => fn(rights))
}
