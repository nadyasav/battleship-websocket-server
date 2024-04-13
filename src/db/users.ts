import { IUser, UserName, WsId } from "../types/types";
import WebSocket from 'ws';

export class Users {
    private users: Map<UserName, IUser>;
    private userNameByWsId: Record<WsId, UserName>;

    constructor(users?: Map<UserName, IUser>) {
        this.users = new Map();
        this.userNameByWsId = {};
        if(users) {
            this.users = users;
        }
    }

    get() {
        return this.users;
    }

    setUser(name: string, userData: IUser) {
        this.users.set(name, userData);
        this.userNameByWsId[userData.id] = name;
    }

    getUser(name: string) {
        return this.users.get(name);
    }

    updateUserWs(name: string, wsId: WsId, ws: WebSocket) {
        const user = this.users.get(name);
        if(user) {
            delete this.userNameByWsId[user.id];
            this.userNameByWsId[wsId] = name;
            user.id = wsId;
            user.ws = ws;
        }
    }

    getUserByWsId(wsId: WsId) {
        const userName = this.userNameByWsId[wsId];
        return this.users.get(userName);
    }
}
