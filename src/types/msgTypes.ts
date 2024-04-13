import { IShip, UUID } from "./types";

export enum RequestMsgType {
    REG = 'reg',
    CREATE_ROOM = "create_room",
    ADD_USER_TO_ROOM = "add_user_to_room",
    ADD_SHIPS = "add_ships",
    ATTACK = "attack"
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

export interface IRequestAttack {
    gameId: UUID;
    x: number;
    y: number;
    indexPlayer: UUID;
}

export interface IRequestReg {
    name: string;
    password: string;
}

export interface IRequestAddShips{
    gameId: UUID;
    ships: Array<IShip>;
    indexPlayer: UUID;
}

export interface IRequestAddUserToRoom {
    indexRoom: UUID;
}
