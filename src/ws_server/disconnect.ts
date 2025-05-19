import { UUID } from "crypto";
import { db } from ".";

export function disconnect(id: UUID) {
const user = db.users.getUserByWsId(id);
  if (!user) {
    return;
  }

  const roomId = db.freeRooms.getRoomIdByUserId(id);
  if (roomId) {
      db.freeRooms.deleteRoom(roomId);
  }
}
