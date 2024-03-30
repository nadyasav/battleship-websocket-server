import WebSocket, { WebSocketServer } from 'ws';
import crypto, { UUID } from 'crypto';
import { BroadcastMsgType, RoomId, IRoomUser, IGameFieldCell, IShip } from '../types/types';
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
          console.log(messageObj.type)
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
            case "add_ships":
              addShips(messageObj);
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

  Object.values(db.gameRooms[roomId].players).forEach(roomUser => {
    const response = {
      type: "create_game",
      data: JSON.stringify({ idGame: roomId, idPlayer: roomUser.index }),
      id: 0,
    }
    db.users.getUser(roomUser.name)?.ws.send(JSON.stringify(response));
  })
}

function addShips(message) {
    const { gameId, ships, indexPlayer } = JSON.parse(message.data);

    try {
      if(!db.gameRooms[gameId]){
        throw new Error('Not exist: gameId');
      }

      if(!db.gameRooms[gameId].players[indexPlayer]) {
        throw new Error('Not valid: indexPlayer');
      }

      if(db.gameRooms[gameId].gameStarted) {
        return;
      }

      const field = createFreeGameField();
      ships.forEach((ship: IShip) => {
        if(!isShipValid(ship)) {
          throw new Error('Not valid ship params');
        }

        setShip(ship, field);
      })

      db.setPlayerShips(gameId, indexPlayer, ships, field);

      const playersWithShips = Object.values(db.gameRooms[gameId].players).filter((player) => !!player.ships);
      if(playersWithShips.length === 2) {
        startGame(gameId);
        const playerTurn = db.gameRooms[gameId].turn;
        if(playerTurn) {
          turn(gameId, playerTurn);
        }
      }
    } catch (e) {
      console.log(e.message);
      return;
    }
}

function startGame(gameId: RoomId) {
  const response = {
    type: "start_game",
    data: {},
    id: 0,
  };

  db.gameRooms[gameId].gameStarted = true;
  Object.values(db.gameRooms[gameId].players).forEach(player => {
    response.data = JSON.stringify({ ships: player.ships, currentPlayerIndex: player.index });
    db.users.getUser(player.name)?.ws.send(JSON.stringify(response));
  })
}

function turn(gameId: RoomId, currentPlayer: UUID) {
  const response = {
    type: "turn",
    data: JSON.stringify({ currentPlayer }),
    id: 0,
  };

  Object.values(db.gameRooms[gameId].players).forEach(player => {
    db.users.getUser(player.name)?.ws.send(JSON.stringify(response));
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

function createFreeGameField() {
  const field: Array<Array<IGameFieldCell>> = [];
  for(let i = 0; i < 10; i++){
    const arr: Array<IGameFieldCell> = [];
    for(let j = 0; j < 10; j++){
      arr.push({y: i, x: j, index: 0, status: "default"})
    }
    field.push(arr);
  }
  return field;
}

function isShipValid(ship: IShip): boolean {
  const { y, x } = ship.position;
  const isXYInField = y >= 0 && x >= 0 && y <= 9 && x <= 9;
  const isShipLengthValid = ship.length > 0 && ship.length <= 4;
  if(!isXYInField || !isShipLengthValid) {
    return false;
  }
  const shipLastCell = ship.direction ? y + ship.length - 1 : x + ship.length - 1;
  return shipLastCell <= 9;
}

function setShip(ship: IShip, field: Array<Array<IGameFieldCell>>) {
  const yLength = ship.direction ? ship.position.y + ship.length : ship.position.y + 1;
  const xLength = ship.direction ? ship.position.x + 1 : ship.position.x + ship.length;
  for(let y = ship.position.y - 1; y <= yLength; y++){
    for(let x = ship.position.x - 1; x <= xLength; x++){
      const isXYInField = y >= 0 && y <= 9 && x >= 0 && x <= 9;
      if(!isXYInField){
        continue;
      }
      if(field[y][x].ship) {
        throw new Error('Not valid ship params');
      }

      field[y][x].index = 1;
      //console.log('ship with borders: ', field[y][x]);
      const isShipCell = y >= ship.position.y && y < yLength && x >= ship.position.x && x < xLength;
      if(isShipCell) {
        field[y][x].ship = {...ship, lifes: ship.length};
      }
    }
  }
}
