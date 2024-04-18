import { db } from ".";
import { errorText } from "../constants";
import { RequestAttack, RequestGameData, ResponseMsgType } from "../types/msgTypes";
import { CellStatus, FreeCells, IAttackResData, IPlayerShips, RoomId, ShipStatus, UUID, XY, XYKey } from "../types/types";
import { isXYInField } from "../utils";
import { turn, updateWinners } from "./common";

export function attack(wsId: UUID, data: RequestAttack) {
    if(getAttackValidationError(data, { x: data.x, y: data.y })) {
      return;
    }

    handleAttack(wsId, data);
}

export async function randomAttack(wsId: UUID, data: RequestGameData) {
  const { gameId, indexPlayer } = data;

  if(getAttackValidationError(data)) {
    return;
  }

  const ships = db.gameRooms.getEnemy(gameId, indexPlayer).ships;
  if(!ships) {
    return;
  }

  const size = ships.freeCells.size;
  const randomIndex = Math.floor(Math.random() * size);
  const coords = Array.from(ships.freeCells.values())[randomIndex];
  handleAttack(wsId, { ...data, ...coords })
}

function handleAttack(wsId: UUID, data: RequestAttack) {
    const { gameId, x, y, indexPlayer } = data;

    const enemy = db.gameRooms.getEnemy(gameId, indexPlayer);
    if(!enemy.ships) {
      return;
    }
    const shotStatus = shot(enemy.ships, x, y);
    console.log(shotStatus);

    if(!shotStatus) {
      return;
    }

    const ship = enemy.ships.field[y][x].ship;
    const resData = {
      position: { x, y },
      currentPlayer: indexPlayer,
      status: shotStatus
    }
    let nextTurnPlayerId = indexPlayer;

    switch (shotStatus) {
      case CellStatus.KILLED:
        handleResultAttack(gameId, resData, ship?.cells);
        resData.status = CellStatus.MISS;
        handleResultAttack(gameId, resData, ship?.borders);
        break;
      case CellStatus.SHOT:
        returnResultAttack(gameId, resData);
        break;
      case CellStatus.MISS:
        returnResultAttack(gameId, resData);
        db.gameRooms.rooms[gameId].turn = enemy.index;
        nextTurnPlayerId = enemy.index;
        break;
    }

    turn(gameId, nextTurnPlayerId);
    if(enemy.ships.shipsCount) {
      return;
    }

    finish(gameId, indexPlayer);
    delete db.gameRooms.rooms[gameId];
    setWinner(wsId);
    updateWinners();
}

function getAttackValidationError(data: RequestGameData, coords?: XY ): Error | undefined {
    const { gameId, indexPlayer } = data;

    try {
      if(!db.gameRooms.rooms[gameId]){
        throw new Error(`${errorText.NOT_EXIST}: ${gameId}`);
      }

      if(db.gameRooms.rooms[gameId].turn !== indexPlayer) {
        throw new Error();
      }

      if(coords) {
        if(!isXYInField(coords.x, coords.y)) {
          throw new Error(`${errorText.NOT_VALID}: x | y`);
        }
      }
    } catch (e) {
      console.log(e.message);
      return e;
    }
}

function setWinner(wsId: UUID) {
    const winnerName = db.users.getUserByWsId(wsId)?.name;
    if(!winnerName) {
      return;
    }

    const winner = db.winers.get(winnerName);
    if(winner) {
      winner.wins++;
    } else {
      db.winers.set(winnerName, { name: winnerName, wins: 1 });
    }
}

function handleResultAttack(gameId: UUID, resData: IAttackResData, cells?: Array<{ y: number; x: number }>) {
    if(cells) {
        cells.forEach(({ y, x }) => {
        resData.position = { x, y };
        returnResultAttack(gameId, resData)
        })
    } else {
        returnResultAttack(gameId, resData)
    }
}

function shot(ships: IPlayerShips, x: number, y: number): ShipStatus | undefined {
  const cell = ships.field[y][x];

  if(cell.status !== CellStatus.DEFAULT) {
    return;
  }

  if(!cell.ship){
    deleteFreeCell(ships.freeCells, { x, y });
    return cell.status = CellStatus.MISS;
  }

  cell.ship.lifes--;
  deleteFreeCell(ships.freeCells, { x, y });
  if(cell.ship.lifes) {
    return cell.status = CellStatus.SHOT;
  } else {
    ships.shipsCount--;
    cell.ship.borders.forEach(({x, y}) => {
      ships.field[y][x].status = CellStatus.MISS;
      deleteFreeCell(ships.freeCells, { x, y });
    })
    return cell.status = CellStatus.KILLED;
  }
}

function returnResultAttack(gameId: RoomId, resData: IAttackResData ) {
    const response = JSON.stringify({
      type: ResponseMsgType.ATTACK,
      data: JSON.stringify({ ...resData }),
      id: 0,
    });

    Object.values(db.gameRooms.rooms[gameId].players).forEach(player => {
      db.users.getUser(player.name)?.ws.send(response);
    })
}

function finish(gameId: RoomId, winPlayer: string) {
    const response = JSON.stringify({
      type: ResponseMsgType.FINISH,
      data: JSON.stringify({ winPlayer }),
      id: 0,
    });

    Object.values(db.gameRooms.rooms[gameId].players).forEach(player => {
      db.users.getUser(player.name)?.ws.send(response);
    })
}

function deleteFreeCell(freeCells: FreeCells, { x, y }: XY) {
    const key: XYKey = `${x}.${y}`;
    const freeCell = freeCells.get(key);
    if(freeCell) {
        freeCells.delete(key);
    }
}
