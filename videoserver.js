// const Server = require('./lib/ws.server.module.js');
module.exports = function videoserver() {
  var express = require('express');
  var path = require('path');
  const WebSocket = require('ws');
  var app = express();
  const wss = new WebSocket.Server({ port: 3001 });

  let monitor;

  app.use(express.static(path.join(__dirname, 'server')));
  app.get('/', function (req, res) {
    // res.send('No Video Displayed');
    res.sendFile(__dirname + '/index.html');
  });

  app.listen(3000, function () {
    console.log('Video server listening on port 3000! Add http://localhost:3000 to your OBS browser!\n');
  });

  wss.on('connection', (ws) => {
    ws.on('message', function incoming(message) {
      message = JSON.parse(message);
      console.log(message);
      switch (message.event) {
        case 'ytp-loaded':
        monitor = ws;// ws.send(JSON.stringify({event: 'play', message: 'sEWx6H8gZH8'}));
        break;
        case 'bot-play':
        console.log(' --> ', {event: 'play', message: message.message});
        monitor.send(JSON.stringify({event: 'play', message: message.message, chatter: message.chatter}));
        default:
        console.log('Not responded message');
      }
    });
  });
}
