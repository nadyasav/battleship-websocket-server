import WebSocket from 'ws';

export type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type UserName = string;
export type RoomId = UUID;
export type WsId = UUID;
export type BroadcastMsgType = "update_room" | "update_winners";
export type ShipStatus = "miss" | "killed" | "shot";
export enum CellStatus {
  MISS = "miss",
  KILLED = "killed",
  SHOT = "shot",
  DEFAULT = "default"
}
export type XY = { x: number; y: number };
export type GameField = Array<Array<IGameFieldCell>>;
export type XYKey =`${number}.${number}`;
export type FreeCells = Map<XYKey, XY>;

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
  enemy: UUID;
  ships?: IPlayerShips;
}

export interface IPlayerShips {
  ships: Array<IShip>;
  field: GameField;
  shipsCount: number;
  freeCells: FreeCells;
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
  position: XY;
  direction: boolean;
  type: "small" | "medium" | "large" | "huge";
  length: number;
}

export interface IShipCell extends IShip{
  lifes: number;
  borders: Array<XY>;
  cells: Array<XY>;
}

export interface IGameFieldCell{
  y: number;
  x: number;
  status: CellStatus;
  ship?: IShipCell;
}

export interface IAttackResData {
  position: XY,
  currentPlayer: string,
  status: ShipStatus,
}

export interface FreeFieldAndCells {
  field: GameField;
  freeCells: FreeCells;
}
