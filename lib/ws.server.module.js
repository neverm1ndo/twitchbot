"use strict"

const WebSocket = require('ws');

module.exports = class Server {
  constructor(webSocketsServerPort) {
    const wss = new WebSocket.Server({ port: webSocketsServerPort });
    let CLIENTS=[];
    wss.on('connection', function connection(ws) {
      CLIENTS.push(ws);
      ws.on('message', function incoming(message) {
        switch (JSON.parse(message).e) {
          case 'connect':
            console.log(message.msg);
            break;
          case 'log':
            CLIENTS.forEach((client) => {
              client.send(message);
            });
            break;
        };
      });
    });
  };
};
