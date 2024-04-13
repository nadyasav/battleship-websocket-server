import { db } from ".";
import WebSocket from 'ws';
import { IRequestReg, ResponseMsgType } from "../types/msgTypes";
import { UUID } from "../types/types";
import { updateRooms, updateWinners } from "./common";
import { errorText } from "../constants";

export function handleUserReg(ws: WebSocket, id: UUID, data: IRequestReg) {
    const { name, password } = data;
    const resData = {
      name: name,
      index: id,
      error: false,
      errorText: '',
    };

    if(!db.users.getUser(name)) {
      db.users.setUser(name, {name, password, id, ws, wins: 0 });
    } else {
      if(db.users.getUser(name)?.password === password) {
        db.users.updateUserWs(name, id, ws);
      } else {
        resData.error = true;
        resData.errorText = errorText.PASSWORD_INCORRECT;
      }
    }

    const response = {
      type: ResponseMsgType.REG,
      data: JSON.stringify(resData),
      id: 0,
    };

    ws.send(JSON.stringify(response))

    if(!resData.errorText) {
      updateWinners();
      updateRooms();
    }
}
