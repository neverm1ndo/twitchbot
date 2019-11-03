'use strict'

const fs = require('fs');
const WebSocket = require('ws');
const Server = require('./lib/ws.server.module.js');

const URL = "ws://localhost:3000/";
const ws = new WebSocket(URL);
let server = new Server(3000);

const Table = require('./lib/table.module.js');
const Timestamp = require('./lib/timestamp.module.js');
const Player = require('./lib/player.module.js');
const Party = require('./lib/party.module.js');
const Manual = require('./lib/manual.module.js');
const Loader = require('./lib/loader.module.js');
const RNG = require('./lib/rng.module.js');
const Bark = require('./lib/bark.module.js');
const Stream = require('./lib/stream.module.js');
const Logo = require('./lib/start.module.js');

const TwitchBot = require('twitch-bot')
const conf = require('./configs/bot.config.js');

let partyGathering, party, manual;
let botStartDate = new Date();
let loader = new Loader();
let environment = JSON.parse(fs.readFileSync("environment.json"));

const Bot = new TwitchBot(environment.bot);

const dictionary = JSON.parse(fs.readFileSync("./etc/banned.words.dict.json"));
const sounds = JSON.parse(fs.readFileSync("./etc/sounds.library.json"));
const automessages = JSON.parse(fs.readFileSync("./etc/automessages.list.json")).m;

const bark = new Bark(conf, automessages, Bot);
const stream = new Stream({api: conf.api, headers: conf.headers}, Bot);

//***************************************************************************************//
Logo();

function ParseBadges(badges) {
  if (badges !== 'No badges' && badges !== null && badges !== undefined) {
    return Object.keys(badges);
  } else {
    return '';
  }
}

function wsmessage(e, message) {
  return JSON.stringify({e: e, msg: message});
}

function CheckPrevilegies(chatter) {
  return (chatter.mod || (chatter.username == environment.bot.channels[0]));
}

Bot.on('join', channel => {
  loader.stop();
  console.log(`Joined channel: \x1b[1m${channel}\x1b[0m \x1b[32m⚫\x1b[0m`);
  console.log(`> Start at      \x1b[1m${Timestamp.stamp()}\x1b[0m`);
  console.log(`> Manual mode   ${conf.manual ? '\x1b[1m\x1b[33menabled\x1b[0m!': 'disabled'}`);
  console.log(`> WEB view      ${conf.manual ? '\x1b[1m\x1b[33menabled\x1b[0m on ws://localhost:3000':'\x1b[31mdisabled\x1b[0m'}`);
  console.log(`> Silent mode   ${conf.silent ? '\x1b[1m\x1b[35menabled\x1b[0m!': 'disabled'}`);
  console.log(`> Chat mode     ${conf.chat ? '\x1b[1m\x1b[33menabled\x1b[0m!': 'disabled'}`);
  console.log(`> Player :      \x1b[1m${conf.player.type}\x1b[0m\n`)
  bark.start();
  stream.info();
  if (conf.web) {
    ws.on('open', function open() {
      ws.send(wsmessage("connect","CLI/SERV connection established"));
    });
  };
});

Bot.on('error', err => {
  console.log('\x1b[31m' + err.message + '\x1b[0m');
  Table.build(err);
})

Bot.on('message', async chatter => {
  if (conf.web) ws.send(wsmessage('log', chatter.message));
  if (conf.chat) { console.log(`> BOT | \x1b[1m[ CHAT ]\x1b[0m\x1b[2m ${Timestamp.stamp()} \x1b[0m\x1b[47m\x1b[30m ${ParseBadges(chatter.badges)} \x1b[0m \x1b[1m${chatter.username}\x1b[0m: ${chatter.message}`); };
  if (!conf.silent) {
    if (partyGathering) {
      if (chatter.message == '+') {
        party.gathering(chatter);
      }
   }
    if (!CheckPrevilegies(chatter)) {
      dictionary.words.forEach((word)=> {
        if (chatter.message.includes(word)) {
          console.warn(`> BOT | Catched banned word \x1b[1m\x1b[31m${word}\x1b[0m!\n      └───> Banned user \x1b[1m\x1b[31m${chatter.username}\x1b[0m`);
            Bot.ban(chatter.username);
          }
        });
      dictionary.timeouts.forEach((word)=> {
        if (chatter.message.includes(word)) {
          console.warn(`> BOT | Catched banned word \x1b[1m\x1b[33m${word}\x1b[0m!\n      └───> Timeouted user \x1b[1m\x1b[33m${chatter.username}\x1b[0m for 50sec`);
//            Bot.timeout(chatter.username);
          };
        });
      }
      if (!partyGathering) {
        for (let command in sounds) {
          if (chatter.message == conf.prefix + command) {
            Player.play(sounds[command].path, sounds[command].delay);
          }
        }
      }
      if (chatter.message.includes('!party')) {
        if (CheckPrevilegies(chatter) && !partyGathering) {
          let amount = chatter.message.split(/\s/)[1];
          if (!amount) amount = 1;
          Bot.say(`OhMyDog @${chatter.username} собирает пати! Пишите + в чай, если хотите попасть в стак!`);
          console.log(`> BOT | \x1b[1m[ PARTY ]\x1b[0m : ${chatter.username} initiated x${amount} party gathering:\n      | Chatters in queue:`);
            partyGathering = true;
            party = new Party([], amount);
          };
        }
        switch (chatter.message) {
          case '!info':
          bark.links();
          break;
          case '!mmr':
          Bot.say('OhMyDog Текущий MMR на мейне: 6200')
          break;
          case '!roll':
          Bot.say(`${chatter.username} нароллил: ${RNG.randomize(0, 100)} BlessRNG`);
          break;
          case '!uptime':
          stream.uptime();
          break;
          case '!s':
          if (CheckPrevilegies(chatter) && partyGathering) {
            partyGathering = false;
            Bot.say(party.stack());
          };
          break;
          case '!help' :
          Bot.say('Вся помощь по командам в описаннии под стримом! OhMyDog');
          break;
          case '!donate':
          bark.donate();
          break;
          case '!players':
          if (party.players) { Bot.say(`Сейчас со стримером играют: ${party.players}`);}
          else { Bot.say("Пати со стримером еще не собиралось.")}
          break;
        }
        Bot.on('subscription', event => {
          Bot.say(`${event.login}, спасибо за подписку, братик! PogChamp`);
          Table.build(event, true);
        });
      }
    });



Bot.on('ban', event => {
  console.log(`> BOT | \x1b[31m\x1b[1m[ BAN ]\x1b[0m : ${Timestamp.stamp()} Ban event info:`);
  Table.build(event, true);
});
Bot.on('timeout', event => {
  console.log(`> BOT | \x1b[33m\x1b[1m[ TIMEOUT ]\x1b[0m : ${Timestamp.stamp()} Timeout event info:`);
  Table.build(event, true);
});

if (conf.manual) {
  manual = new Manual();
  manual.std.addListener('data', async (c) => {
    c = c.toString().trim();
    if (c.includes('$say')) {
      Bot.say(c.split(`$say`)[1].trim());
      manual.log(c);
    } else if (c.includes('$help')) {
      manual.help()
    } else if (c.includes(`$status`) || c.includes(`$refresh`)) {
      stream.info();
    } else {
      manual.error();
    }
  });
}
