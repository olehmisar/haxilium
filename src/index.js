import assert from 'assert'
import Haxilium from './haxilium'


let roomExists = false
export default function haxilium(config) {
    assert(!roomExists, 'You cannot make two rooms on one page')

    roomExists = true
    return new Haxilium(config)
}
