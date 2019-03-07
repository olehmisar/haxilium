import { RoomConfig } from '../interfaces/RoomConfig';


declare global {
    interface Window {
        HBInit(config: RoomConfig<any>): any
        onHBLoaded(): void
    }
}
