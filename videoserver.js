const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const request = require('request');
const Queue = require('./lib/queue.module.js');

module.exports = class VideoServer {
  constructor() {
    this.app = express();
    this.wss = new WebSocket.Server({ port: 3001 });
    this.queue = new Queue({ cooldown: 20 });
    this.monitor = undefined;
    this.controls = undefined;
    this.karaoka = undefined;
    this.bot = undefined;
    this.speaker = undefined;
    this.currentVideo = undefined;
    this.playerState = {
      state: '',
      volume: '',
      muted: '',
    };
    this.key = JSON.parse(fs.readFileSync(`${__dirname}/etc/google.api.key.json`)).key;
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        const depeche = JSON.parse(message);
        switch (depeche.event) {
          case 'ytp-loaded':
            this.monitor = ws; // saving monitor socket
            this.monitor.send(JSON.stringify({ event: 'current-state-request' }));
            console.log('> \x1b[32mMonitor connected\x1b[0m', ' localhost:3000');
            break;
          case 'controls-connection':
            this.controls = ws; // saving controls socket
            try { this.monitor.send(JSON.stringify({ event: 'current-state-request' })); } catch (e) { console.log('ERROR: Waiting for monitor...'); }
            if (this.currentVideo) {
              this.controls.send(JSON.stringify({ event: 'video-data', message: this.currentVideo }));
            }
            console.log('> \x1b[32mControls connected\x1b[0m', ' localhost:3000/controls');
            break;
          case 'karaoka-connection':
            this.karaoka = ws; // saving karaoka socket
            console.log('> \x1b[32mKaraoke monitor connected\x1b[0m');
            if (this.currentVideo) {
              this.karaoka.send(JSON.stringify({ event: 'video-data', message: this.currentVideo }));
            }
            console.log('> \x1b[32mControls connected\x1b[0m', ' localhost:3000/controls');
            break;
          case 'speaker-connection':
            this.speaker = ws; // saving karaoka socket
            this.speaker.send(JSON.stringify({ event: 'connection', message: 'Connected' }));
            console.log('> \x1b[32mSpeaker connected\x1b[0m', ' localhost:3000/speaker');
            break;
          case 'speaker-message':
            console.log(depeche.message);
            if (this.speaker) this.speaker.send(JSON.stringify({ event: 'hl_msg', message: depeche.message }));
            break;
          case 'remote':
            if (this.monitor) this.monitor.send(JSON.stringify({ event: 'remote', message: depeche.message, value: message.value }));
            break;
          case 'current-info':
            if (this.currentVideo) {
              this.controls.send(JSON.stringify({ event: 'video-data', message: this.currentVideo }));
            }
            break;
          case 'current-state-request':
            if (this.monitor) { this.monitor.send(JSON.stringify({ event: 'current-state-request' })); } else {
              console.log('> \x1b[31mMonitor in not connected, wait...\x1b[0m If monitor not connects automatically for long time, open or refresh it manually in OBS.\x1b[0m');
            }
            break;
          case 'current-state-data':
            this.changeState(depeche.message);
            if (this.controls) {
              this.controls.send(JSON.stringify({ event: 'current-state-data', message: depeche.message }));
            } else {
              console.log('> \x1b[31mControls in not connected, wait...\x1b[0m If controls not connects automatically for long time, open or refresh it browser localhost:3000/controls .\x1b[0m');
            }
            break;
          case 'state':
            if (this.controls) this.controls.send(JSON.stringify(message));
            break;
          case 'bot-play':
            if (this.playerState.state === 5 || this.playerState.state === 0) {
              this.queue.check(message).then(() => {
                this.playVideo(message);
              }).catch(() => {
                if (message.chatter !== undefined) {
                  this.bot.send(JSON.stringify({ event: 'queue-warn', chatter: message.chatter }));
                }
              });
            } else {
              this.bot.send(JSON.stringify({ event: 'clip-error', message: `ItsBoshyTime @${message.chatter}, подожди, пока доиграет предыдущий клип.` }));
            }
            break;
          case 'bot-client':
            this.bot = ws;
            console.log('> \x1b[32mBot connected\x1b[0m');
            break;
          case 'req-queue':
            this.bot.send(JSON.stringify({ event: 'queue', message: this.queue.list }));
            break;
          case 'req-ytcd':
            this.queue.countTime(depeche.message).then((cd) => {
              this.bot.send(JSON.stringify({ event: 'ytcd', message: depeche.message, cooldown: cd }));
            }).catch((user) => {
              this.bot.send(JSON.stringify({ event: 'ytcd-error', message: user }));
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
    this.app.get('/', (req, res) => {
      res.sendFile(`${__dirname}/index.html`);
    });
    this.app.get('/controls', (req, res) => {
      res.sendFile(`${__dirname}/server/controls.html`);
    });
    this.app.get('/karaoka', (req, res) => {
      res.sendFile(`${__dirname}/server/karaoka.html`);
    });
    this.app.get('/speaker', (req, res) => {
      res.sendFile(`${__dirname}/server/speaker.html`);
    });
    this.app.listen(3000, () => {
      console.log('Video server listening on port 3000! Add http://localhost:3000 to your OBS browser!\n');
    });
  }

  extractVideoID(url) {
    this.regExp = new RegExp(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\\x12\\?]*).*/);
    const match = url.match(this.regExp);
    return match && match[7].length === 11 ? match[7] : console.error('NO videoID');
  }

  getVideoInfo(id) {
    const options = {
      url: `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=${this.key}`,
      method: 'GET',
    };
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (response) {
          console.log(body);
          resolve(body);
        } else {
          reject();
        }
      });
    });
  }

  getVideoCaptions(id) {
    const options = {
      url: `https://www.googleapis.com/youtube/v3/captions?videoId=${id}&part=snippet&key=${this.key}`,
      // url: `https://www.googleapis.com/youtube/v3/captions/id?id=${id}=`,
      method: 'GET',
    };
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (response) {
          resolve(body);
        } else {
          reject();
        }
      });
    });
  }

  getVideoStats(id) {
    const options = {
      url: `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=statistics&key=${this.key}`,
      method: 'GET',
    };
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (response) {
          console.log(body);
          resolve(body);
        } else {
          reject();
        }
      });
    });
  }

  changeState(newstate) {
    this.playerState = newstate;
  }

  playVideo(message) {
    const ID = this.extractVideoID(message.message);
    if (ID !== undefined) {
      this.getVideoStats(ID).then((body) => {
        if (+JSON.parse(body).items['0'].statistics.viewCount > 20000 || Queue.checkWhitelist(message.chatter)) {
          this.queue.toTimeout(message.chatter);
          this.getVideoInfo(ID).then(() => {
            this.currentVideo = body;
            this.controls.send(JSON.stringify({ event: 'video-data', message: body }));
            this.bot.send(JSON.stringify({ event: 'clip-data', message: body, chatter: message.chatter }));
          });
          this.monitor.send(JSON.stringify({ event: 'play', message: ID, chatter: message.chatter }));
        } else {
          this.bot.send(JSON.stringify({ event: 'clip-error', chatter: message.chatter, message: 'ItsBoshyTime Недостаточно просмотров для запуска.' }));
        }
      });
    } else {
      this.bot.send(JSON.stringify({ event: 'clip-error', chatter: message.chatter, message: `ItsBoshyTime  Что-то не так с ссылкой на клип, @${message.chatter}. Проверь ее валидность и попробуй еще раз.` }));
    }
  }
};
