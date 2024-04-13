import { db } from ".";
import { errorText } from "../constants";
import { IRequestAttack, ResponseMsgType } from "../types/msgTypes";
import { CellStatus, IAttackResData, IPlayerShips, RoomId, ShipStatus, UUID } from "../types/types";
import { isXYInField } from "../utils";
import { turn, updateWinners } from "./common";

export function attack(wsId: UUID, data: IRequestAttack) {
    const { gameId, x, y, indexPlayer } = data;

    try {
      if(!db.gameRooms[gameId]){
        throw new Error(`${errorText.NOT_EXIST}: ${gameId}`);
      }

      if(db.gameRooms[gameId].turn !== indexPlayer) {
        return;
      }

      if(!isXYInField(x, y)) {
        throw new Error(`${errorText}: x | y`);
      }
    } catch (e) {
      console.log(e.message);
      return;
    }

    const enemyId = db.gameRooms[gameId].players[indexPlayer].enemy;
    const ships = db.gameRooms[gameId].players[enemyId].ships;
    if(!ships) {
      return;
    }
    const shotStatus = shot(ships, x, y);
    console.log(shotStatus);

    if(!shotStatus) {
      return;
    }

    const ship = ships.field[y][x].ship;
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
        db.gameRooms[gameId].turn = enemyId;
        nextTurnPlayerId = enemyId;
        break;
    }

    turn(gameId, nextTurnPlayerId);
    if(ships.shipsCount) {
      return;
    }

    finish(gameId, indexPlayer);
    delete db.gameRooms[gameId];

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
    updateWinners();
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
    return cell.status = CellStatus.MISS;
  }

  cell.ship.lifes--;
  if(cell.ship.lifes) {
    return cell.status = CellStatus.SHOT;
  } else {
    ships.shipsCount--;
    cell.ship.borders.forEach(({x, y}) => ships.field[y][x].status = CellStatus.MISS)
    return cell.status = CellStatus.KILLED;
  }
}

function returnResultAttack(gameId: RoomId, resData: IAttackResData ) {
    const response = JSON.stringify({
      type: ResponseMsgType.ATTACK,
      data: JSON.stringify({ ...resData }),
      id: 0,
    });

    Object.values(db.gameRooms[gameId].players).forEach(player => {
      db.users.getUser(player.name)?.ws.send(response);
    })
}

function finish(gameId: RoomId, winPlayer: string) {
    const response = JSON.stringify({
      type: ResponseMsgType.FINISH,
      data: JSON.stringify({ winPlayer }),
      id: 0,
    });

    Object.values(db.gameRooms[gameId].players).forEach(player => {
      db.users.getUser(player.name)?.ws.send(response);
    })
}
