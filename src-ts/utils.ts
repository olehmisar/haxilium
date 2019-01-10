const playerProps = 'id, name, team, admin, position'.split(', ')
export function isPlayerObject(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false
    for (const prop of playerProps) {
        if (!(prop in obj)) return false
    }
    return true
}
