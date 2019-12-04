'use strict'

let express = require('express');
let path = require('path');
const Queue = require('./lib/queue.module.js');
const WebSocket = require('ws');
const fs = require('fs');
const request = require('request');

module.exports = class VideoServer {
  constructor() {
    this.app = express();
    this.wss = new WebSocket.Server({ port: 3001 });
    this.queue = new Queue({ cooldown: 20 });
    this.monitor;
    this.controls;
    this.bot;
    this.currentVideo;
    this.playerState = {
      state: '',
      volume: '',
      muted: '',
    };
    this.key = JSON.parse(fs.readFileSync(__dirname + '/etc/google.api.key.json'));
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        message = JSON.parse(message);
        switch (message.event) {
          case 'ytp-loaded':
            this.monitor = ws; // saving monitor socket
            this.monitor.send(JSON.stringify({event: 'current-state-request'}));
            console.log('> \x1b[32mMonitor connected\x1b[0m', ' localhost:3000');
          break;
          case 'controls-connection':
            this.controls = ws; // saving controls socket
            try { this.monitor.send(JSON.stringify({event: 'current-state-request'})); }
            catch (e) { console.log ('ERROR: Waiting for monitor...')}
            if (this.currentVideo) {
              this.controls.send(JSON.stringify({event: 'video-data', message: this.currentVideo}));
            }
            console.log('> \x1b[32mControls connected\x1b[0m', ' localhost:3000/controls');
          break;
          case 'remote':
            if (this.monitor) this.monitor.send(JSON.stringify({event: 'remote', message: message.message, value: message.value}));
          break;
          case 'current-info':
            if (this.currentVideo) {
              this.controls.send(JSON.stringify({event: 'video-data', message: this.currentVideo}));
            }
          break;
          case 'current-state-request':
            if (this.monitor) { this.monitor.send(JSON.stringify({event: 'current-state-request'})) }
            else {console.log('> \x1b[31mMonitor in not connected, wait...\x1b[0m If monitor not connects automatically for long time, open or refresh it manually in OBS.\x1b[0m');}
          break;
          case 'current-state-data':
            this.changeState(message.message);
            if (this.controls) {
              this.controls.send(JSON.stringify({event: 'current-state-data', message: message.message}));
            } else {
              console.log('> \x1b[31mControls in not connected, wait...\x1b[0m If controls not connects automatically for long time, open or refresh it browser localhost:3000/controls .\x1b[0m');
            }
          break;
          case 'state':
            if (this.controls) this.controls.send(JSON.stringify(message));
          break;
          case 'bot-play':
          if (this.playerState.state == 5 || this.playerState.state == 0) {
            this.queue.check(message).then((message) => {
              this.playVideo(message);
            }).catch((message) => {
              if (message.chatter !== undefined) {
                this.bot.send(JSON.stringify({event: 'queue-warn', chatter: message.chatter}))
              }
            });
          } else {
            this.bot.send(JSON.stringify({event: 'clip-error', message: `ItsBoshyTime @${message.chatter}, подожди, пока доиграет предыдущий клип.`}))
          }
          break;
          case 'bot-client':
            this.bot = ws;
            console.log('> \x1b[32mBot connected\x1b[0m');
          break;
          case 'req-queue':
            this.bot.send(JSON.stringify({event: 'queue', message: this.queue.list}));
          break;
          break;
          case 'req-ytcd':
          this.queue.countTime(message.message).then((cd) => {
            this.bot.send(JSON.stringify({event: 'ytcd', message: message.message, cooldown: cd}));
          }).catch(user => {
            this.bot.send(JSON.stringify({event: 'ytcd-error', message: user}));
          });
          break;
          default:
            console.log('> Not responded message: ', message);
        }
      });
    });
  }
  start() {
    this.app.use(express.static(path.join(__dirname, 'server')));
    this.app.get('/', function (req, res) {
      res.sendFile(__dirname + '/index.html');
    });
    this.app.get('/controls', function (req, res) {
      res.sendFile(__dirname + '/server/controls.html');
    });
    this.app.listen(3000, function () {
      console.log('Video server listening on port 3000! Add http://localhost:3000 to your OBS browser!\n');
    });
  }


  extractVideoID(url){
    let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    let match = url.match(regExp);
    if ( match && match[7].length == 11 ){
        return match[7];
    } else {
        console.error("\x1b[31mCould not extract video ID.\x1b[0m");
    }
  }

   getVideoInfo(id) {
    let options = {
      url: `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=${this.key.key}`,
      method: 'GET',
    };
    return new Promise ((resolve, reject) => {
      request(options,(error, response, body) => {
        if (response) {
          resolve(body);
        } else {
          reject();
        }
      });
    })
  };

  getVideoStats(id) {
    let options = {
      url: `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=statistics&key=${this.key.key}`,
      method: 'GET',
    };
    return new Promise ((resolve, reject) => {
      request(options,(error, response, body) => {
        if (response) {
          resolve(body);
        } else {
          reject();
        }
      });
    })
  }

  changeState(newstate) {
    this.playerState = newstate;
  }

  playVideo(message) {
    let ID = this.extractVideoID(message.message);
    if (ID !== undefined) {
      this.getVideoStats(ID).then((body) => {
        if (+JSON.parse(body).items['0'].statistics.viewCount > 20000) {
          this.queue.toTimeout(message.chatter);
          this.getVideoInfo(ID).then((body) => {
            this.currentVideo = body;
            this.controls.send(JSON.stringify({event: 'video-data', message: body }));;
            this.bot.send(JSON.stringify({event: 'clip-data', message: body, chatter: message.chatter}));
          });
          this.monitor.send(JSON.stringify({event: 'play', message: ID, chatter: message.chatter}));
        } else {
          this.bot.send(JSON.stringify({event: 'clip-error', chatter: message.chatter, message: 'ItsBoshyTime Недостаточно просмотров для запуска.'}));
        }
      });
    } else {
      this.bot.send(JSON.stringify({event: 'clip-error', chatter: message.chatter, message: `ItsBoshyTime  Что-то не так с ссылкой на клип, @${message.chatter}. Проверь ее валидность и попробуй еще раз.`}));
    }
  }
}
