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

export interface IRoom {
  roomId: RoomId;
  roomUsers: Array<IRoomUser>;
}
