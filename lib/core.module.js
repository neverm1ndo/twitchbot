const fs = require('fs');
const readline = require('readline');

const ChromeLauncher = require('chrome-launcher');
const TwitchBot = require('twitch-bot');
const VideoServer = require('../server/videoserver');

const Table = require('./table.module');
const Timestamp = require('./timestamp.module');
const Party = require('./party.module');
const Loader = require('./loader.module');
const RNG = require('./rng.module');
const Bark = require('./bark.module');
const Start = require('./start.module');
const Queue = require('./queue.module');

const URL = 'ws://localhost:3001';

const environment = JSON.parse(fs.readFileSync(`${__dirname}/../environment.json`));
const args = process.argv.slice(2);

args.forEach((arg) => {
  environment.bot.channels = [arg];
});

const Bot = new TwitchBot(environment.bot);

module.exports = class OMD {
  constructor(options) {
    this.opts = options;
    this.loader = new Loader();
    this.VServer = new VideoServer();
    this.userconf = this.VServer.config;
    this.bark = new Bark(this.userconf, this.opts.schedule.automessages, Bot);
    this.party = {
      gathering: false,
      current: undefined,
    };
    this.state = {
      status: 'works',
      switch: () => {
        if (this.state.status === 'works') {
          this.state.status = 'sleeps';
        } else {
          this.state.status = 'works';
        }
      },
    };
    this.ws = new WebSocket(URL);
    this.ws.on('open', () => {
      console.log('> Connection established\n');
      this.ws.send(this.wsmessage('bot-client', true));
    });
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

  init() {
    Start();
    this.VServer.start();

    Bot.on('join', (channel) => {
      this.loader.stop();
      console.log(`  Joined channel:  \x1b[1m${channel}\x1b[0m \x1b[32m⚫\x1b[0m\n\n`,
        `    Start at      \x1b[1m${Timestamp.stamp()}\x1b[0m\n`,
        `    Manual mode   ${this.userconf.manual ? '\x1b[1m\x1b[32menabled\x1b[0m' : 'disabled'}\n`,
        `    Silent mode   ${this.userconf.silent ? '\x1b[1m\x1b[31menabled\x1b[0m' : 'disabled'}\n`,
        `    Chat mode     ${this.userconf.chat ? '\x1b[1m\x1b[33menabled\x1b[0m!' : 'disabled'}\n`);
      this.bark.start();
    });
    Bot.on('part', (channel) => {
      console.log(`  \x1b[1m${Timestamp.stamp()}\x1b[0m Left channel:  \x1b[1m${channel}\x1b[0m \x1b[32m⚫\x1b[0m\n\n`);
      this.bark.stop();
    });
    Bot.on('error', (err) => {
      console.log(`\x1b[31m${err.message}\x1b[0m`);
      Table.build(err);
    });
    Bot.on('message', async (chatter) => {
      this.readChattersMessage(chatter);
    });
    Bot.on('subscription', (event) => {
      Bot.say(`${event.login}, спасибо за подписку, братик! PogChamp. Получай смайлик и возможность ставить свою музыку на стриме!`);
      Table.build(event, true);
    });
    Bot.on('ban', (event) => {
      console.log(`> BOT | \x1b[31m\x1b[1m[ BAN ]\x1b[0m : ${Timestamp.stamp()} Ban event info:`);
      Table.build(event, true);
    });
    Bot.on('timeout', (event) => {
      console.log(`> BOT | \x1b[33m\x1b[1m[ TIMEOUT ]\x1b[0m : ${Timestamp.stamp()} Timeout event info:`);
      Table.build(event, true);
    });
  }

  wsmessage(e, msg) {
    this.e = e;
    this.msg = msg;
    return JSON.stringify({ event: this.e, message: this.msg });
  }

  ParseBadges(badges) {
    this.badges = badges;
    if (this.badges !== 'No badges' && this.badges !== null && this.badges !== undefined) {
      return Object.keys(this.badges);
    }
    return '';
  }

  isPrevileged(chatter) {
    this.chatter = chatter;
    return (this.chatter.mod || (this.chatter.username === environment.bot.channels[0]));
  }

  CheckSub(badges) {
    this.badges = badges;
    let isSub = false;
    this.badges.forEach((badge) => {
      if (badge === 'founder' || badge === 'subscriber' || badge === 'broadcaster') {
        isSub = true;
      }
    });
    return isSub;
  }

  static openControlsWindow() {
    if (process.platform === 'win32') {
      ChromeLauncher.launch({
        ignoreDefaultFlags: true,
        startingUrl: 'http://localhost:3000/controls',
        chromeFlags: ['--app=http://localhost:3000/controls', '--window-size=470,190'],
      }).then((chrome) => {
        console.log(`Chrome debugging port running on ${chrome.port}`);
      });
      ChromeLauncher.launch({
        ignoreDefaultFlags: true,
        startingUrl: 'http://localhost:3000/speaker',
        chromeFlags: ['--app=http://localhost:3000/speaker', '--window-size=300,200'],
      }).then((chrome) => {
        console.log(`Chrome debugging port running on ${chrome.port}`);
      });
    }
  }

  readChattersMessage(chatter) {
    if (this.state.status === 'works') {
      if (chatter.custom_reward_id) {
        if (chatter.custom_reward_id === 'aadd172a-8d1d-4cda-9282-06ad218bfecf') {
          this.ws.send(JSON.stringify({ event: 'bot-play', message: chatter.message, chatter: chatter.username }));
        }
        if (chatter.custom_reward_id === '83a50c0d-1051-4e57-a6e7-4d8a3263654c') {
          if (chatter.message.length < 100) {
            this.ws.send(this.wsmessage('speaker-message', chatter.message));
          } else {
            Bot.say('ItsBoshyTime Слишком много символов. Разрешено максимум 100.');
          }
        }
      }
      if (this.userconf.chat) console.log(`> BOT | \x1b[1m[ CHAT ]\x1b[0m\x1b[2m ${Timestamp.stamp()} \x1b[0m\x1b[47m\x1b[30m ${this.ParseBadges(chatter.badges)} \x1b[0m \x1b[1m${chatter.username}\x1b[0m: ${chatter.message}`);
      if (!this.party.gathering) {
        Object.keys(this.opts.schedule.sounds).forEach((command) => {
          if (chatter.message === this.userconf.prefix + command) {
            this.ws.send(JSON.stringify({ event: 'play-sound', message: `./../${this.opts.schedule.sounds[command].path}`, tchatter: chatter }));
          }
        });
      }
      if (chatter.message.includes(`${this.userconf.prefix}yt`)) {
        const link = chatter.message.split(/\s/)[1];
        if (this.CheckSub(this.ParseBadges(chatter.badges)) || Queue.checkWhitelist(chatter.username)) {
          this.ws.send(JSON.stringify({ event: 'bot-play', message: link, chatter: chatter.username }));
        }
      }
      if (chatter.message.includes(`${this.userconf.prefix}tts`)) {
        const cut = chatter.message.split(`${this.userconf.prefix}tts`)[1];
        if (this.CheckSub(this.ParseBadges(chatter.badges)) || Queue.checkWhitelist(chatter.username)) {
          this.ws.send(this.wsmessage('speaker-message', cut));
        }
      }
      if (!this.userconf.silent) {
        // BANHAMMER
        if (!this.isPrevileged(chatter)) {
          this.opts.schedule.dictionary.words.forEach((word) => {
            if (chatter.message.includes(word)) {
              console.warn(`> BOT | Catched banned word \x1b[1m\x1b[31m${word}\x1b[0m!\n      └───> Banned user \x1b[1m\x1b[31m${chatter.username}\x1b[0m`);
              Bot.ban(chatter.username);
            }
          });
          this.opts.schedule.dictionary.timeouts.forEach((word) => {
            if (chatter.message.includes(word)) {
              console.warn(`> BOT | Catched banned word \x1b[1m\x1b[33m${word}\x1b[0m!\n      └───> Timeouted user \x1b[1m\x1b[33m${chatter.username}\x1b[0m for 50sec`);
            }
          });
        }
        // COMMANDS
        switch (chatter.message) {
          case (chatter.message.includes('!party')): {
            if (this.isPrevileged(chatter) && !this.party.gathering) {
              let amount = chatter.message.split(/\s/)[1];
              if (!amount) amount = 1;
              Bot.say(`OhMyDog @${chatter.username} собирает пати! Пишите + в чай, если хотите попасть в стак!`);
              console.log(`> BOT | \x1b[1m[ PARTY ]\x1b[0m : ${chatter.username} initiated x${amount} party gathering:\n      | Chatters in queue:`);
              this.party.gathering = true;
              this.party.current = new Party([], amount);
            }
            break;
          }
          case '+': {
            if (this.party.gathering) {
              this.party.gathering(chatter);
            }
            break;
          }
          case '!info': {
            this.bark.links();
            break;
          }
          case '!mmr': {
            Bot.say(`OhMyDog Текущий MMR на мейне: ${this.userconf.mmr}`);
            break;
          }
          case '!roll': {
            Bot.say(`${chatter.username} нароллил: ${RNG.randomize(0, 101)} BlessRNG`);
            break;
          }
          case '!s': {
            if (this.isPrevileged(chatter) && this.party.gathering) {
              this.party.gathering = false;
              Bot.say(this.party.current.stack());
            }
            break;
          }
          case '!help': {
            Bot.say('Вся помощь по командам в описаннии под стримом! OhMyDog');
            break;
          }
          case '!donate': {
            this.bark.donate();
            break;
          }
          case '!queue': {
            if (this.isPrevileged(chatter)) this.ws.send(this.wsmessage('req-queue', true));
            break;
          }
          case '!cd': {
            this.ws.send(this.wsmessage('req-ytcd', chatter.username));
            break;
          }
          case '!караока': {
            break;
          }
          case '!нуждики': {
            this.ws.send(this.wsmessage('get-nuzhdik', chatter.username));
            break;
          }
          case '!players': {
            if (this.party.current.players) { Bot.say(`Сейчас со стримером играют: ${this.party.current.players}`); } else { Bot.say('Пати со стримером еще не собиралось.'); }
            break;
          }
          default: { break; }
        }
      }
    }
  }

  setControls() {
    if (this.userconf.manual) {
      readline.emitKeypressEvents(process.stdin);
      const stdin = process.openStdin();
      stdin.setRawMode(true);
      stdin.setEncoding('utf8');
      let command = '';
      stdin.on('keypress', (str, key) => {
        command += str;
        if (key.name === 'backspace') {
          if (command !== '') {
            command = command.slice(0, -2);
          }
        }
        if (key.sequence === '\r') {
          if (command.includes('$say')) {
            Bot.say(command.split('$say')[1].trim());
          }
          if (command.includes('$vi')) {
            this.ws.send(this.wsmessage('speaker-message', command.split('$vi')[1].trim()));
          }
          if (command === '$v') {
            this.ws.send(JSON.stringify({ event: 'bot-play', message: 'https://www.youtube.com/watch?v=hTWKbfoikeg', chatter: 'OHMYDOG' }));
          }
          if (command === '$sc') {
            this.ws.send(JSON.stringify({ event: 'play-sound', message: `./../${this.opts.schedule.sounds['бип'].path}`, chatter: 'OHMYDOG' }));
          }
          if (command === '$n') {
            this.ws.send(JSON.stringify({ event: 'get-nuzhdik', message: null }));
          }
          command = '';
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(`${command}`);
        }
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${command}`);
        if (key.sequence === '\u0003') {
          process.stdout.write('\n');
          process.exit();
        }
      });
    }
  }
};
