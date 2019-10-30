"use strict"

const WebSocket = require('ws');
const http = require('http');

module.exports = class Server {

  constructor(webSocketsServerPort) {
    let server = http.createServer((create, response) => {});
    server.listen(webSocketsServerPort, function() {
      console.log((new Date()) + " Server is listening on port "
      + webSocketsServerPort);
    });
    let wss = new WebSocket.Server({ server });
    wss.on('connection', (ws, req) => {
      console.log('Connected:', req.connection.remoteAddress);
      ws.on('message', function incoming(message) {
        console.log('received: %s', message);
      });
      ws.send(JSON.stringify({"e": "log", "msg": "WS: Successfully conected to local WS server"}));
    });
  }

  send(msg) {
    this.wss.send(JSON.stringify({"e": "log", "msg": msg}))
  }
};
