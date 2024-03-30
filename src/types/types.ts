import WebSocket from 'ws';

export type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type UserName = string;
export type RoomId = UUID;
export type WsId = UUID;
export type BroadcastMsgType = "update_room" | "update_winners";

export interface IUser {
  name: string;
  password: string;
  id: WsId;
  ws: WebSocket;
  wins: number;
}

export interface IWiner {
  name: string;
  wins: number;
}

export interface IRoomUser {
  name: string;
  index: WsId
}

export interface IPlayer extends IRoomUser {
  ships?: Array<IShip>;
  field?: Array<Array<IGameFieldCell>>;
  enemy: UUID;
}

export interface IRoom {
  roomId: RoomId;
  roomUsers: Array<IRoomUser>;
}

export interface IGameRoom{
  roomId: RoomId;
  players: Record<UUID, IPlayer>;
  gameStarted: boolean;
  turn?: UUID;
}

export interface IShip {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  type: "small" | "medium" | "large" | "huge";
  length: number;
}

export interface IShipCell extends IShip{
  lifes: number;
}

export interface IGameFieldCell{
  y: number;
  x: number;
  index: 0 | 1;
  status: "miss" | "killed" | "shot" | "default";
  ship?: IShipCell;
}
