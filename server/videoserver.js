const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const request = require('request');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const Queue = require('../lib/queue.module.js');
const RNG = require('../lib/rng.module');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
//  уникальный Id находится в configs/clientid.json
const clientID = JSON.parse(fs.readFileSync(`${__dirname}/../configs/clientid.json`)).id;

module.exports = class VideoServer {
  constructor() {
    this.conf = JSON.parse(fs.readFileSync(`${__dirname}/../configs/client.${clientID}.json`));
    this.app = express();
    this.queue = new Queue({ cooldown: this.conf.queueCD });
    this.globalCD = false;
    this.monitor = undefined;
    this.controls = undefined;
    this.karaoka = undefined;
    this.bot = undefined;
    this.speaker = undefined;
    this.currentVideo = undefined;
    this.dashboards = [];
    this.botStatus = 'works';
    this.playerState = {
      state: '',
      volume: '',
      muted: '',
    };
    this.app.use(express.static(path.join(__dirname)));
    this.app.get('/monitor', (req, res) => {
      if (req.query.id === clientID) {
        res.sendFile(`${__dirname}/yt-features/index.html`);
      }
    });
    this.app.get(`/${clientID}`, (req, res) => {
      res.sendFile(`${__dirname}/dashboard/index.html`);
    });
    this.app.get('/controls', (req, res) => {
      if (req.query.id === clientID) {
        res.sendFile(`${__dirname}/yt-features/controls.html`);
      }
    });
    this.app.get('/karaoka', (req, res) => {
      if (req.query.id === clientID) {
        res.sendFile(`${__dirname}/karaoka/karaoka.html`);
      }
    });
    this.app.get('/speaker', (req, res) => {
      if (req.query.id === clientID) {
        res.sendFile(`${__dirname}/speaker-features/speaker.html`);
      }
    });
    /// BOT API
    this.app.get('/configuration', (req, res) => {
      if (req.query.id === clientID) {
        res.send(JSON.stringify({
          config: this.conf,
          amsg: JSON.parse(fs.readFileSync(`${__dirname}/../etc/automessages.list.json`)),
          filter: JSON.parse(fs.readFileSync(`${__dirname}/../etc/banned.words.dict.json`)),
          sounds: JSON.parse(fs.readFileSync(`${__dirname}/../etc/sounds.library.json`)),
        }));
      }
    });
    this.httpsServer = http.createServer({
      port: 8080,
    }, this.app).listen(process.env.HTTPS_PORT, () => {
      console.log(`  Video server listening on port ${process.env.HTTPS_PORT}. Add https://omd.nmnd.ru/controls to your OBS browser!\n`);
    });
    this.key = JSON.parse(fs.readFileSync(`${__dirname}/../etc/google.api.key.json`)).key;
    this.wss = new WebSocket.Server({ server: this.httpsServer });
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        const depeche = JSON.parse(message);
        switch (depeche.event) {
          case 'ytp-loaded':
            this.monitor = ws; // saving monitor socket
            this.monitor.send(JSON.stringify({ event: 'current-state-request' }));
            console.log('>', `[${ws._socket.remoteAddress}]`, ' \x1b[32mMonitor connected\x1b[0m', ' localhost:3000');
            break;
          case 'controls-connection':
            this.controls = ws; // saving controls socket
            this.bot.send(JSON.stringify({ event: 'wakeup', message: null }));
            try { this.monitor.send(JSON.stringify({ event: 'current-state-request' })); } catch (e) { console.log('  [ERROR] Waiting for monitor...'); }
            if (this.currentVideo) {
              this.controls.send(JSON.stringify({ event: 'video-data', message: this.currentVideo }));
            }
            console.log('>', `[${ws._socket.remoteAddress}]`, ' \x1b[32mControls connected\x1b[0m');
            break;
          case 'dashboard-connection':
            this.dashboards.push(ws);
            console.log('>', `[${ws._socket.remoteAddress}]`, ' \x1b[32mСonnected to dashboard\x1b[0m');
            ws.send(JSON.stringify({ event: 'bot-status', message: this.botStatus }));
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
            this.speaker = ws; // saving speaker socket
            this.speaker.send(JSON.stringify({ event: 'connection', message: 'Connected' }));
            console.log('>', `[${ws._socket.remoteAddress}]`, ' \x1b[32mSpeaker connected\x1b[0m', ' localhost:3000/speaker');
            break;
          case 'speaker-message':
            console.log(depeche.message);
            if (this.speaker) this.speaker.send(JSON.stringify({ event: 'hl_msg', message: depeche.message }));
            break;
          case 'remote':
            if (this.monitor) this.monitor.send(JSON.stringify({ event: 'remote', message: depeche.message, value: depeche.value }));
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
              this.queue.check(depeche).then((dep) => {
                this.playVideo(dep);
              }).catch((dep) => {
                if (dep.chatter !== undefined) {
                  this.bot.send(JSON.stringify({ event: 'queue-warn', chatter: dep.chatter }));
                }
              });
            } else {
              this.bot.send(JSON.stringify({ event: 'clip-error', message: `ItsBoshyTime @${depeche.chatter}, подожди, пока доиграет предыдущий клип.` }));
            }
            break;
          case 'bot-client':
            this.bot = ws;
            console.log('>', `[${ws._socket.remoteAddress}]`, ' \x1b[32mBot connected\x1b[0m');
            break;
          case 'bot-status':
            this.botStatus = depeche.message;
            this.dashboards.forEach((db) => {
              db.send(JSON.stringify({ event: 'bot-status', message: depeche.message }));
            });
            break;
          case 'play-sound':
            if (this.globalCD === false) {
              this.speaker.send(JSON.stringify({ event: 'sound_msg', message: depeche.message }));
              this.globalCD = true;
              setTimeout(() => {
                this.globalCD = false;
              }, 30000);
            }
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
          case 'amsg-reconf':
            try {
              fs.writeFileSync(`${__dirname}/../etc/automessages.list.json`, JSON.stringify({ m: depeche.message }));
              this.bot.send(JSON.stringify({ event: 'amsg-reconf', message: depeche.message }));
              ws.send(JSON.stringify({ event: 'save-success', message: null }));
            } catch (e) {
              this.dashboard.send(JSON.stringify({ event: 'save-fail', message: e }));
            }
            break;
          case 'save-conf':
            try {
              this.conf = depeche.message;
              this.queue.innerCooldown = this.conf.qcd;
              fs.writeFileSync(`${__dirname}/../configs/client.${clientID}.json`, JSON.stringify(depeche.message));
              this.bot.send(JSON.stringify({ event: 'save-conf', message: depeche.message }));
              ws.send(JSON.stringify({ event: 'save-success', message: null }));
            } catch (e) {
              this.dashboard.send(JSON.stringify({ event: 'save-fail', message: e }));
            }
            break;
          case 'filter-reconf': {
            const newfilter = { words: [], timeouts: [] };
            depeche.message[0].split(',').forEach((word) => {
              newfilter.words.push(word);
            });
            if (depeche.message[1].length > 0) {
              depeche.message[1].split(',').forEach((word) => {
                newfilter.timeouts.push(word);
              });
            }
            try {
              fs.writeFileSync(`${__dirname}/../etc/banned.words.dict.json`, JSON.stringify(newfilter));
              ws.send(JSON.stringify({ event: 'save-success', message: null }));
              this.bot.send(JSON.stringify({ event: 'filter-reconf', message: null }));
            } catch (e) {
              this.dashboard.send(JSON.stringify({ event: 'save-fail', message: e }));
            }
            break;
          }
          case 'get-nuzhdik': {
            if (!this.globalCD) {
              fs.readdir(path.join(__dirname, 'nujdiki/NuzhdikiSound'), (err, files) => {
                if (err) {
                  return console.log(`Unable to scan directory: ${err}`);
                }
                this.speaker.send(JSON.stringify({ event: 'sound_msg', message: `./../nujdiki/NuzhdikiSound/${files[RNG.randomize(0, 318)]}` }));
                return true;
              });
              this.globalCD = true;
              setTimeout(() => {
                this.globalCD = false;
              }, 30000);
            }
            break;
          }
          default:
            console.log('>', `[${ws._socket.remoteAddress}]`, ' Not responded message: ', message);
        }
      });
      ws.on('close', () => {
        switch (ws) {
          case this.monitor:
            console.log('>', `[${ws._socket.remoteAddress}]`, ' \x1b[31mMonitor disconnected\x1b[0m');
            break;
          case this.controls:
            console.log('>', `[${ws._socket.remoteAddress}]`, ' \x1b[31mControls disconnected\x1b[0m');
            this.bot.send(JSON.stringify({ event: 'shutup', message: null }));
            break;
          case this.speaker:
            console.log('>', `[${ws._socket.remoteAddress}]`, ' \x1b[31mSpeaker disconnected\x1b[0m');
            break;
          default: break;
        }
        this.dashboards.forEach((ds) => {
          this.dashboards.pop(ds);
        });
      });
    });
  }

  get config() {
    return this.conf;
  }

  getVideoInfo(id) {
    const options = {
      url: `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=${this.key}`,
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

  getVideoCaptions(id) {
    const options = {
      url: `https://www.googleapis.com/youtube/v3/captions?videoId=${id}&part=snippet&key=${this.key}`,
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

  getVideoID(depeche) {
    this.regExp = new RegExp(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);
    const match = depeche.message.match(this.regExp);
    return (match && match[7].length === 11) ? match[7] : console.error('NO videoID');
  }

  /* eslint no-control-regex: off  */
  /* eslint no-useless-escape: off */
  playVideo(depeche) {
    const ID = this.getVideoID(depeche);
    if (ID !== undefined) {
      this.getVideoStats(ID).then((body) => {
        if (+JSON.parse(body).items['0'].statistics.viewCount > 20000 || Queue.checkWhitelist(depeche.chatter)) {
          this.queue.toTimeout(depeche.chatter);
          this.getVideoInfo(ID).then((info) => {
            this.currentVideo = info;
            this.controls.send(JSON.stringify({ event: 'video-data', message: info }));
            this.bot.send(JSON.stringify({ event: 'clip-data', message: info, chatter: depeche.chatter }));
          });
          this.monitor.send(JSON.stringify({ event: 'play', message: ID, chatter: depeche.chatter }));
        } else {
          this.bot.send(JSON.stringify({ event: 'clip-error', chatter: depeche.chatter, message: 'ItsBoshyTime Недостаточно просмотров для запуска.' }));
        }
      });
    } else {
      this.bot.send(JSON.stringify({ event: 'clip-error', chatter: depeche.chatter, message: `ItsBoshyTime  Что-то не так с ссылкой на клип, @${depeche.chatter}. Проверь ее валидность и попробуй еще раз.` }));
    }
  }
};
