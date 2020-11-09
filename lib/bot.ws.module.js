const fs = require('fs');
const Timestamp = require('./timestamp.module');

module.exports = class BotWS {
  constructor(URL, Bot) {
    this.ws = new WebSocket(URL);
    this.ws.on('message', (message) => {
      const depeche = JSON.parse(message);
      switch (depeche.event) {
        case 'clip-data': {
          Bot.say(`/me   ▶ Проигрывается ${JSON.parse(depeche.message).items[0].snippet.title}`);
          break;
        }
        case 'queue-warn': {
          Bot.say(`ItsBoshyTime ${depeche.chatter}, твоя очередь еще не пришла`);
          break;
        }
        case 'queue': {
          const users = [];
          depeche.message.forEach((user) => {
            users.push(user.username);
          });
          Bot.say(users.length > 0 ? `Кулдаун на воспроизведение клипов у : ${users}` : 'Список пуст.');
          break;
        }
        case 'clip-error': {
          Bot.say(depeche.message);
          break;
        }
        case 'ytcd': {
          Bot.say(`@${depeche.message}, осталось еще ${depeche.cooldown}`);
          break;
        }
        case 'ytcd-error': {
          Bot.say(`@${depeche.message}, ты не на кулдауне`);
          break;
        }
        case 'shutup': {
          if (this.state.status === 'works') {
            console.log(`  \x1b[1m${Timestamp.stamp()}\x1b[0m`, ' Shut down...');
            this.bark.stop();
            this.state.switch();
            this.ws.send(this.wsmessage('bot-status', this.state.status));
          }
          break;
        }
        case 'wakeup': {
          if (this.state.status === 'sleeps') {
            console.log(`  \x1b[1m${Timestamp.stamp()}\x1b[0m`, ' Waking up...');
            this.bark.start();
            this.state.switch();
            this.ws.send(this.wsmessage('bot-status', this.state.status));
          }
          break;
        }
        case 'amsg-reconf': {
          this.bark.innerMesg = depeche.message;
          break;
        }
        case 'save-conf': {
          this.bark.innerConf = depeche.message;
          this.userconf = depeche.message;
          break;
        }
        case 'filter-reconf': {
          this.opts.schedule.dictionary = JSON.parse(fs.readFileSync('./etc/banned.words.dict.json'));
          break;
        }
        case 'bot-status': {
          this.ws.send(this.wsmessage('bot-status', this.state.status));
          break;
        }
        default: {
          console.error('Unexpected WS message');
          break;
        }
      }
    });
  }
};
