import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { DB } from '../db/db';
import { handleMsg } from './msgHandler';
import { PORT } from '../constants';
import { disconnect } from './disconnect';

export const db = new DB();

export const wsServer = () => {
    const webSocketServer = new WebSocketServer({port: PORT});

    webSocketServer.on('connection', function connection(ws) {
        ws.on('error', console.error);

        const id = crypto.randomUUID();
        console.log(id);

        ws.on('message', function message(message) {
          handleMsg(ws, id, message.toString());
        });

        ws.on('close', () => {
          console.log('Disconnect: ', id);
          //disconnect(id);
        });
    });
}
