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
  ws.on('message', message => {
    console.log(`Received message from ${req.connection.remoteAddress} => ${message}`)
  })
  ws.send('WS: Successfully conected to local WS server')
});

server.listen(3000);

server.on('upgrade', function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;

  if (pathname === '/foo') {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss1.emit('connection', ws, request);
    });
  } else{
     socket.destroy();
  }
});
