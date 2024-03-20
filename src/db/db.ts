import { IRoom, IWiner, RoomId, IRoomUser, UserName, WsId } from "../types/types";
import { Users } from "./users";

export class DB {
    users: Users;
    winers: Record<UserName, IWiner>;
    freeRooms: Record<RoomId, IRoom>;
    private freeRoomsIdByUserId: Record<WsId, RoomId>;
    gameRooms: Record<RoomId, IRoom>;

    constructor() {
        this.users = new Users();
        this.winers = {};
        this.freeRooms = {};
        this.freeRoomsIdByUserId = {};
        this.gameRooms = {};
    }

    createFreeRoom(roomId: RoomId, user: IRoomUser) {
        this.freeRooms[roomId] = { roomId, roomUsers: [user] };
        this.freeRoomsIdByUserId[user.index] = roomId;
    }

    getFreeRoomIdByUserId(wsId: WsId) {
        return this.freeRoomsIdByUserId[wsId];
    }

    createGameRoom(roomId: RoomId, roomUsers: Array<IRoomUser>) {
        this.gameRooms[roomId] = { roomId, roomUsers };
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
}
