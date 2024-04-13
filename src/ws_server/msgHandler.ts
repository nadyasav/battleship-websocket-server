import { handleUserReg } from './userReg';
import { RequestMsgType } from '../types/msgTypes';
import { addUserToRoom, createRoom } from './rooms';
import { addShips } from './ships';
import { attack } from './attack';
import { UUID } from '../types/types';
import WebSocket from 'ws';

export function handleMsg(ws: WebSocket, id: UUID, message: string) {
    const messageObj = JSON.parse(message);
    let data;
    if(messageObj.data) {
        data = JSON.parse(messageObj.data);
    }
    console.log(messageObj.type)

    switch (messageObj.type) {
        case RequestMsgType.REG:
            handleUserReg(ws, id, data);
            break;
        case RequestMsgType.CREATE_ROOM:
            createRoom(id);
            break;
        case RequestMsgType.ADD_USER_TO_ROOM:
            addUserToRoom(id, data);
            break;
        case RequestMsgType.ADD_SHIPS:
            addShips(data);
            break;
        case RequestMsgType.ATTACK:
            attack(id, data);
            break;
    }
}
