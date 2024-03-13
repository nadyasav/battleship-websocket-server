import WebSocket, { WebSocketServer } from 'ws';
import crypto from 'crypto';

type UUID = `${string}-${string}-${string}-${string}-${string}`;

type UserName = string;

interface IUser {
  name: string;
  password: string;
  id: UUID;
  ws: WebSocket;
  wins: number;
}

interface IWiner {
  name: string;
  wins: number;
}

const users: Record<UserName, IUser> = {};
const winers: Record<UserName, IWiner> = {};

export const wsServer = () => {
    const webSocketServer = new WebSocketServer({port: 3000});

    webSocketServer.on('connection', function connection(ws) {
        ws.on('error', console.error);

        const id = crypto.randomUUID();

        ws.on('message', function message(message) {
          const messageObj = JSON.parse(message.toString());
          switch (messageObj.type) {
            case "reg":
              handleUserReg(ws, id, messageObj);
              updateWinners();
              break
          }
        });
    });
}

function handleUserReg(ws: WebSocket, id: UUID, message) {
  const { name, password } = JSON.parse(message.data);
  const resData = {
    name: name,
    index: id,
    error: false,
    errorText: '',
  };

  if(!users[name]) {
    users[name] = {name, password, id, ws, wins: 0}
  } else {
    if(users[name].password === password) {
      users[name].id = id;
      users[name].ws = ws;
    } else {
      resData.error = true;
      resData.errorText = 'Password incorrect';
    }
  }

  const response = {
    type: "reg",
    data: JSON.stringify(resData),
    id: 0,
  };

  ws.send(JSON.stringify(response))
}

function updateWinners() {
  const response = {
    type: "update_winners",
    data: JSON.stringify(Object.values(winers)),
    id: 0,
  }

  Object.values(users).forEach(user => {
    user.ws.send(JSON.stringify(response));
  })
}
