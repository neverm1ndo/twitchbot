'use strict'

const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const fs = require('fs');
const Table = require('../../lib/table.module.js');

let conf = require('../../configs/bot.config.js');

let server, index;

fs.readFile('./client/client.html', function (err, html) {
    if (err) {
        throw err;
    }
    else {
      index = html;
    }
});
server = http.createServer(function(request, response) {
    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write(index);
    response.end();
})
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('Connected:', req.connection.remoteAddress);
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    switch (message) {
      case 'conf':
        ws.send(JSON.stringify({"e": "conf", "msg" : conf}));
        break;
      }
  });
  ws.send(JSON.stringify({"e": "log", "msg": "WS: Successfully conected to local WS server"}));
});

server.listen(3000);
