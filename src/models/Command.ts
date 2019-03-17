export class Command<TPlayer, TRoles extends { [role: string]: number }> {
    constructor(
        public readonly names: ReadonlyArray<string>,
        public hasAccess: (roles: (keyof TRoles)[]) => boolean,
        public meta: any,
        public execute: (player: TPlayer, args: string[]) => any
    ) { }
}
