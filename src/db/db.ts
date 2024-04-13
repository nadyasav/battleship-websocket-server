import { SHIPS_COUNT } from "../constants";
import { IRoom, IWiner, RoomId, IRoomUser, UserName, WsId, IGameFieldCell, UUID, IGameRoom, IPlayer, IShip } from "../types/types";
import { Users } from "./users";

export class DB {
    users: Users;
    winers: Map<UserName, IWiner>;
    freeRooms: Record<RoomId, IRoom>;
    private freeRoomsIdByUserId: Record<WsId, RoomId>;
    gameRooms: Record<RoomId, IGameRoom>;
    //gameField: Array<Array<IGameFieldCell>>;

    constructor() {
        this.users = new Users();
        this.winers = new Map();
        this.freeRooms = {};
        this.freeRoomsIdByUserId = {};
        this.gameRooms = {};
        //this.gameField = [];
    }

    createFreeRoom(roomId: RoomId, user: IRoomUser) {
        this.freeRooms[roomId] = { roomId, roomUsers: [user] };
        this.freeRoomsIdByUserId[user.index] = roomId;
    }

    getFreeRoomIdByUserId(wsId: WsId) {
        return this.freeRoomsIdByUserId[wsId];
    }

    createGameRoom(roomId: RoomId, playersArr: Array<IRoomUser>) {
        const players: Record<UUID, IPlayer> = {};
        players[playersArr[0].index] = { ...playersArr[0], enemy: playersArr[1].index }
        players[playersArr[1].index] = { ...playersArr[1], enemy: playersArr[0].index }
        this.gameRooms[roomId] = { roomId, players, gameStarted: false };
    }

    deleteFreeRoom(roomId: RoomId) {
        const roomCreatorId = this.freeRooms[roomId].roomUsers[0].index;
        delete this.freeRoomsIdByUserId[roomCreatorId];
        delete this.freeRooms[roomId];
    }

    deleteFreeRoomByUserId(userId: RoomId) {
        const idFreeRoomId = this.freeRoomsIdByUserId[userId];
        delete this.freeRooms[idFreeRoomId];
        delete this.freeRoomsIdByUserId[userId];
    }

    setPlayerShips(gameId: RoomId, indexPlayer: UUID, ships: Array<IShip>, field: Array<Array<IGameFieldCell>>) {
        const player = this.gameRooms[gameId].players[indexPlayer];
        this.gameRooms[gameId].players[indexPlayer] = { ...player, ships: { ships, field, shipsCount: SHIPS_COUNT } };
        if(!this.gameRooms[gameId].turn) {
            this.gameRooms[gameId].turn = indexPlayer;
        }
    }
}
