import { IRoom, IRoomUser, RoomId, WsId } from "../types/types";

export class FreeRooms {
    rooms: Record<RoomId, IRoom>;
    private roomsIdByUserId: Record<WsId, RoomId>;

    constructor() {
        this.rooms = {};
        this.roomsIdByUserId = {};
    }

    getRoomIdByUserId(wsId: WsId) {
        return this.roomsIdByUserId[wsId];
    }

    createRoom(roomId: RoomId, user: IRoomUser) {
        this.rooms[roomId] = { roomId, roomUsers: [user] };
        this.roomsIdByUserId[user.index] = roomId;
    }

    deleteRoom(roomId: RoomId) {
        const roomCreatorId = this.rooms[roomId].roomUsers[0].index;
        delete this.roomsIdByUserId[roomCreatorId];
        delete this.rooms[roomId];
    }

    deleteRoomByUserId(userId: RoomId) {
        const roomId = this.roomsIdByUserId[userId];
        delete this.rooms[roomId];
        delete this.roomsIdByUserId[userId];
    }
}
