import { SHIPS_COUNT } from "../constants";
import { FreeFieldAndCells, IGameRoom, IPlayer, IRoomUser, IShip, RoomId, UUID } from "../types/types";

export class GameRooms {
    rooms: Record<RoomId, IGameRoom>;

    constructor() {
        this.rooms = {};
    }

    createRoom(roomId: RoomId, playersArr: Array<IRoomUser>) {
        const players: Record<UUID, IPlayer> = {};
        players[playersArr[0].index] = { ...playersArr[0], enemy: playersArr[1].index }
        players[playersArr[1].index] = { ...playersArr[1], enemy: playersArr[0].index }
        this.rooms[roomId] = { roomId, players, gameStarted: false };
    }

    setPlayerShips(gameId: RoomId, indexPlayer: UUID, ships: Array<IShip>, fieldAndCells: FreeFieldAndCells) {
        const player = this.rooms[gameId].players[indexPlayer];
        this.rooms[gameId].players[indexPlayer] = { ...player, ships: { ships, ...fieldAndCells, shipsCount: SHIPS_COUNT } };
        if(!this.rooms[gameId].turn) {
            this.rooms[gameId].turn = indexPlayer;
        }
    }

    getEnemy(gameId: UUID, indexPlayer: UUID): IPlayer{
        const enemyId = this.rooms[gameId].players[indexPlayer].enemy;
        const enemy = this.rooms[gameId].players[enemyId];
        return enemy;
    }
}
