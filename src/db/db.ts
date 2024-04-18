import { IWiner, UserName } from "../types/types";
import { FreeRooms } from "./freeRooms";
import { GameRooms } from "./gameRooms";
import { Users } from "./users";

export class DB {
    users: Users;
    freeRooms: FreeRooms;
    gameRooms: GameRooms;
    winers: Map<UserName, IWiner>;
    //gameField: Array<Array<IGameFieldCell>>;

    constructor() {
        this.users = new Users();
        this.freeRooms = new FreeRooms();
        this.gameRooms = new GameRooms();
        this.winers = new Map();
        //this.gameField = [];
    }
}
