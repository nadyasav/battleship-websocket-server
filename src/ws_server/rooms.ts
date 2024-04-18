import { db } from ".";
import { MAX_COUNT_USERS_IN_ROOM } from "../constants";
import { IRequestAddUserToRoom, ResponseMsgType } from "../types/msgTypes";
import { IRoomUser, RoomId, UUID } from "../types/types";
import { updateRooms } from "./common";
import crypto from 'crypto';


export function createRoom(wsId: UUID) {
    const roomWs = db.freeRooms.getRoomIdByUserId(wsId);
    if(roomWs) {
      return;
    }

    const roomId = crypto.randomUUID();
    const user = db.users.getUserByWsId(wsId);
    if(user) {
      db.freeRooms.createRoom(roomId, { name: user.name, index: wsId});
      updateRooms();
    }
}

export function addUserToRoom(wsId: UUID, data: IRequestAddUserToRoom) {
    const { indexRoom } = data;
    const freeRoom = db.freeRooms.rooms[indexRoom];
    if(!freeRoom) {
      return;
    }
    if(freeRoom.roomUsers.length >= MAX_COUNT_USERS_IN_ROOM || freeRoom.roomUsers[0].index === wsId) {
      return;
    }

    const user = db.users.getUserByWsId(wsId);
    if(user) {
      db.freeRooms.rooms[indexRoom].roomUsers[1] = {name: user.name, index: wsId};
      updateRooms();
      createGame(indexRoom, db.freeRooms.rooms[indexRoom].roomUsers);
      updateRooms();
    }
}

function createGame(roomId: RoomId, roomUsers: Array<IRoomUser>) {
    db.gameRooms.createRoom(roomId, roomUsers);
    db.freeRooms.deleteRoom(roomId);
    db.freeRooms.deleteRoomByUserId(roomUsers[1].index);

    Object.values(db.gameRooms.rooms[roomId].players).forEach(roomUser => {
        const response = {
        type: ResponseMsgType.CREATE_GAME,
        data: JSON.stringify({ idGame: roomId, idPlayer: roomUser.index }),
        id: 0,
        }
        db.users.getUser(roomUser.name)?.ws.send(JSON.stringify(response));
    })
}
