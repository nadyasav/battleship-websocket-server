import { db } from ".";
import { FIELD_SIZE, INDEX_LAST_FIELD_CELL, MAX_COUNT_USERS_IN_ROOM, SHIP_MAX_LENGTH, errorText } from "../constants";
import { IRequestAddShips, ResponseMsgType } from "../types/msgTypes";
import { CellStatus, IGameFieldCell, IShip, RoomId } from "../types/types";
import { isXYInField } from "../utils";
import { turn } from "./common";

export function addShips(data: IRequestAddShips) {
    const { gameId, ships, indexPlayer } = data;

    try {
      if(!db.gameRooms[gameId]){
        throw new Error(`${errorText.NOT_EXIST}: ${gameId}`);
      }

      if(!db.gameRooms[gameId].players[indexPlayer]) {
        throw new Error(`${errorText.NOT_VALID}: ${indexPlayer}`);
      }

      if(db.gameRooms[gameId].gameStarted) {
        return;
      }

      const field = createFreeGameField();
      ships.forEach((ship: IShip) => {
        if(!isShipValid(ship)) {
          throw new Error(errorText.NOT_VALID_SHIP_PARAMS);
        }

        setShip(ship, field);
      })

      db.setPlayerShips(gameId, indexPlayer, ships, field);

      const playersWithShips = Object.values(db.gameRooms[gameId].players).filter((player) => !!player.ships);
      if(playersWithShips.length === MAX_COUNT_USERS_IN_ROOM) {
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
    type: ResponseMsgType.START_GAME,
    data: {},
    id: 0,
  };

  db.gameRooms[gameId].gameStarted = true;
  Object.values(db.gameRooms[gameId].players).forEach(player => {
    response.data = JSON.stringify({ ships: player.ships, currentPlayerIndex: player.index });
    db.users.getUser(player.name)?.ws.send(JSON.stringify(response));
  })
}

function createFreeGameField() {
  const field: Array<Array<IGameFieldCell>> = [];
  for(let i = 0; i < FIELD_SIZE; i++){
    const arr: Array<IGameFieldCell> = [];
    for(let j = 0; j < FIELD_SIZE; j++){
      arr.push({y: i, x: j, index: 0, status: CellStatus.DEFAULT})
    }
    field.push(arr);
  }
  return field;
}

function isShipValid(ship: IShip): boolean {
  const { y, x } = ship.position;
  const isShipLengthValid = ship.length > 0 && ship.length <= SHIP_MAX_LENGTH;
  if(!isXYInField(x, y) || !isShipLengthValid) {
    return false;
  }
  const shipLastCell = ship.direction ? y + ship.length - 1 : x + ship.length - 1;
  return shipLastCell <= INDEX_LAST_FIELD_CELL;
}

function setShip(ship: IShip, field: Array<Array<IGameFieldCell>>) {
  const yLength = ship.direction ? ship.position.y + ship.length : ship.position.y + 1;
  const xLength = ship.direction ? ship.position.x + 1 : ship.position.x + ship.length;
  const borders: Array<{ y: number; x: number }> = [];
  const cells: Array<{ y: number; x: number }> = [];
  const fieldCellShip = {...ship, lifes: ship.length, borders, cells};

  for(let y = ship.position.y - 1; y <= yLength; y++){
    for(let x = ship.position.x - 1; x <= xLength; x++){
      if(!isXYInField(x, y)){
        continue;
      }
      if(field[y][x].ship) {
        throw new Error(errorText.NOT_VALID_SHIP_PARAMS);
      }

      field[y][x].index = 1;
      const isShipCell = y >= ship.position.y && y < yLength && x >= ship.position.x && x < xLength;
      if(isShipCell) {
        cells.push({ y, x });
        field[y][x].ship = fieldCellShip;
      } else {
        borders.push({ y, x });
      }
    }
  }
}
