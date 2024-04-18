import { IShip, UUID } from "./types";

export enum RequestMsgType {
    REG = 'reg',
    CREATE_ROOM = "create_room",
    ADD_USER_TO_ROOM = "add_user_to_room",
    ADD_SHIPS = "add_ships",
    ATTACK = "attack",
    RANDOM_ATTACK = "randomAttack"
}

export enum ResponseMsgType {
    REG = 'reg',
    UPDATE_ROOM = "update_room",
    UPDATE_WINNERS = "update_winners",
    TURN = "turn",
    START_GAME = "start_game",
    FINISH = "finish",
    ATTACK = "attack",
    CREATE_GAME = "create_game"
}

export interface RequestGameData {
    gameId: UUID;
    indexPlayer: UUID;
}
export interface RequestAttack extends RequestGameData{
    x: number;
    y: number;
}

export interface IRequestReg {
    name: string;
    password: string;
}

export interface IRequestAddShips extends RequestGameData{
    ships: Array<IShip>;
}

export interface IRequestAddUserToRoom {
    indexRoom: UUID;
}
