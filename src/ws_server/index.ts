import WebSocket, { WebSocketServer } from 'ws';
import crypto, { UUID } from 'crypto';
import { BroadcastMsgType, RoomId, IRoomUser } from '../types/types';
import { DB } from '../db/db';

let db = new DB();

export const wsServer = () => {
    const webSocketServer = new WebSocketServer({port: 3000});

    webSocketServer.on('connection', function connection(ws) {
        ws.on('error', console.error);

        const id = crypto.randomUUID();
        console.log(id);

        ws.on('message', function message(message) {
          const messageObj = JSON.parse(message.toString());
          switch (messageObj.type) {
            case "reg":
              handleUserReg(ws, id, messageObj);
              updateWinners();
              updateRooms();
              break;
            case "create_room":
              handleCreateRoom(id);
              updateRooms();
              break;
            case "add_user_to_room":
              addUserToRoom(id, messageObj);
              updateRooms();
              break;
          }
        });
    });
}

function handleUserReg(ws: WebSocket, id: UUID, message) {
  const { name, password } = JSON.parse(message.data);
  const resData = {
    name: name,
    index: id,
    error: false,
    errorText: '',
  };

  if(!db.users.getUser(name)) {
    db.users.setUser(name, {name, password, id, ws, wins: 0 });
  } else {
    if(db.users.getUser(name)?.password === password) {
      db.users.updateUserWs(name, id, ws);
    } else {
      resData.error = true;
      resData.errorText = 'Password incorrect';
    }
  }

  const response = {
    type: "reg",
    data: JSON.stringify(resData),
    id: 0,
  };

  ws.send(JSON.stringify(response))
}

function handleCreateRoom(wsId: UUID) {
  const roomWs = db.getFreeRoomIdByUserId(wsId);
  if(roomWs) {
    return;
  }

  const roomId = crypto.randomUUID();
  const user = db.users.getUserByWsId(wsId);
  if(user) {
    db.createFreeRoom(roomId, { name: user.name, index: wsId});
  }
}

function addUserToRoom(wsId: UUID, message) {
  const { indexRoom } = JSON.parse(message.data);
  const freeRoom = db.freeRooms[indexRoom];
  if(!freeRoom) {
    return;
  }
  if(freeRoom.roomUsers.length >= 2 || freeRoom.roomUsers[0].index === wsId) {
    return;
  }

  const user = db.users.getUserByWsId(wsId);
  if(user) {
    db.freeRooms[indexRoom].roomUsers[1] = {name: user.name, index: wsId};
    updateRooms();
    createGame(indexRoom, db.freeRooms[indexRoom].roomUsers);
  }
}

function createGame(roomId: RoomId, roomUsers: Array<IRoomUser>) {
  db.createGameRoom(roomId, roomUsers);
  db.deleteFreeRoom(roomId);
  db.deleteFreeRoomByUserId(roomUsers[1].index);

  db.gameRooms[roomId].roomUsers.forEach(roomUser => {
    const response = {
      type: "create_game",
      data: JSON.stringify({ roomId, idPlayer: roomUser.index }),
      id: 0,
    }
    db.users.getUser(roomUser.name)?.ws.send(JSON.stringify(response));
  })
}

function updateWinners() {
  const data = JSON.stringify(Object.values(db.winers));
  broadcastMsg("update_winners", data);
}

function updateRooms() {
  const data = JSON.stringify(Object.values(db.freeRooms));
  broadcastMsg("update_room", data);
}

function broadcastMsg(type: BroadcastMsgType, data: string) {
  const response = { type, data, id: 0 };

  db.users.get().forEach(user => {
    user.ws.send(JSON.stringify(response));
  })
}
