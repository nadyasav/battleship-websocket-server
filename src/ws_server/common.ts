import { db } from ".";
import { ResponseMsgType } from "../types/msgTypes";
import { BroadcastMsgType, RoomId, UUID } from "../types/types";

export function turn(gameId: RoomId, currentPlayer: UUID) {
    const response = {
      type: ResponseMsgType.TURN,
      data: JSON.stringify({ currentPlayer }),
      id: 0,
    };

    Object.values(db.gameRooms[gameId].players).forEach(player => {
      db.users.getUser(player.name)?.ws.send(JSON.stringify(response));
    })
}

export function updateWinners() {
    const data = JSON.stringify(Array.from(db.winers.values()));
    broadcastMsg(ResponseMsgType.UPDATE_WINNERS, data);
}

export function updateRooms() {
    const data = JSON.stringify(Object.values(db.freeRooms));
    broadcastMsg(ResponseMsgType.UPDATE_ROOM, data);
}

function broadcastMsg(type: BroadcastMsgType, data: string) {
    const response = { type, data, id: 0 };

    db.users.get().forEach(user => {
        user.ws.send(JSON.stringify(response));
    })
}
