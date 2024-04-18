import { db } from ".";
import { FIELD_SIZE, INDEX_LAST_FIELD_CELL, MAX_COUNT_USERS_IN_ROOM, SHIP_MAX_LENGTH, errorText } from "../constants";
import { IRequestAddShips, ResponseMsgType } from "../types/msgTypes";
import { CellStatus, FreeCells, FreeFieldAndCells, GameField, IGameFieldCell, IShip, RoomId } from "../types/types";
import { isXYInField } from "../utils";
import { turn } from "./common";

export function addShips(data: IRequestAddShips) {
    const { gameId, ships, indexPlayer } = data;

    try {
      if(!db.gameRooms.rooms[gameId]){
        throw new Error(`${errorText.NOT_EXIST}: ${gameId}`);
      }

      if(!db.gameRooms.rooms[gameId].players[indexPlayer]) {
        throw new Error(`${errorText.NOT_VALID}: ${indexPlayer}`);
      }

      if(db.gameRooms.rooms[gameId].gameStarted) {
        return;
      }

      const fieldAndCells = createFreeGameField();
      ships.forEach((ship: IShip) => {
        if(!isShipValid(ship)) {
          throw new Error(errorText.NOT_VALID_SHIP_PARAMS);
        }

        setShip(ship, fieldAndCells.field);
      })

      db.gameRooms.setPlayerShips(gameId, indexPlayer, ships, fieldAndCells);

      const playersWithShips = Object.values(db.gameRooms.rooms[gameId].players).filter((player) => !!player.ships);
      if(playersWithShips.length === MAX_COUNT_USERS_IN_ROOM) {
        startGame(gameId);
        const playerTurn = db.gameRooms.rooms[gameId].turn;
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

  db.gameRooms.rooms[gameId].gameStarted = true;
  Object.values(db.gameRooms.rooms[gameId].players).forEach(player => {
    response.data = JSON.stringify({ ships: player.ships, currentPlayerIndex: player.index });
    db.users.getUser(player.name)?.ws.send(JSON.stringify(response));
  })
}

function createFreeGameField(): FreeFieldAndCells {
  const field: GameField = [];
  const freeCells: FreeCells = new Map();

  for(let y = 0; y < FIELD_SIZE; y++){
    const arr: Array<IGameFieldCell> = [];
    for(let x = 0; x < FIELD_SIZE; x++){
      arr.push({ y, x, status: CellStatus.DEFAULT })
      freeCells.set(`${x}.${y}`, { x, y });
    }
    field.push(arr);
  }
  return { field, freeCells };
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

function setShip(ship: IShip, field: GameField) {
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
