#!/usr/bin/env node

'use strict';

process.stdout.write('\x1B[?25l');

const fs = require('fs');
const WebSocket = require('ws');

const ChromeLauncher = require('chrome-launcher');
const VideoServer = require('./videoserver.js');

const readline = require('readline');


const URL = "ws://localhost:3001";
const ws = new WebSocket(URL);
const VServer = new VideoServer();

const Table = require('./lib/table.module.js');
const Timestamp = require('./lib/timestamp.module.js');
const Player = require('./lib/player.module.js');
const Party = require('./lib/party.module.js');
const Manual = require('./lib/manual.module.js');
const Loader = require('./lib/loader.module.js');
const RNG = require('./lib/rng.module.js');
const Bark = require('./lib/bark.module.js');
const Stream = require('./lib/stream.module.js');
const Start = require('./lib/start.module.js');
const Queue = require('./lib/queue.module.js');

const TwitchBot = require('twitch-bot')
let conf = require('./configs/bot.config.js');

let partyGathering, party, manual;
let botStartDate = new Date();
let loader = new Loader();
let environment = JSON.parse(fs.readFileSync(__dirname + "/environment.json"));
let args = process.argv.slice(2);

const Bot = new TwitchBot(environment.bot);

const dictionary = JSON.parse(fs.readFileSync(__dirname + "/etc/banned.words.dict.json"));
const sounds = JSON.parse(fs.readFileSync(__dirname + "/etc/sounds.library.json"));
const automessages = JSON.parse(fs.readFileSync(__dirname + "/etc/automessages.list.json")).m;

const bark = new Bark(conf, automessages, Bot);
const stream = new Stream({api: conf.api, headers: conf.headers}, Bot);

//***********************************************************************//
Start();

VServer.start();

args.forEach((a) => {
  if (a == 'silent') {
    conf.silent = true;
  } else if (a == 'web') {
    conf.web = true;
  } else if (a == 'chatoff') {
    conf.chat = false;
  } else if (a == 'moff') {
    conf.manual = false;
  }
});

function ParseBadges(badges) {
  if (badges !== 'No badges' && badges !== null && badges !== undefined) {
    return Object.keys(badges);
  } else {
    return '';
  }
}

function wsmessage(e, message) {
  return JSON.stringify({event: e, message: message});
}

function CheckPrevilegies(chatter) {
  return (chatter.mod || (chatter.username == environment.bot.channels[0]));
}

function CheckSub(badges) {
  let isSub = false;
  badges.forEach((badge) => {
    if (badge == "founder" || badge == "subscriber" || badge =="broadcaster") {
      isSub = true;
    }
  });
  return isSub;
};

function openControlsWindow() {
  if (process.platform === "win32") {
    ChromeLauncher.launch({
      ignoreDefaultFlags: true,
      startingUrl: 'http://localhost:3000/controls',
      chromeFlags: ['--app=http://localhost:3000/controls', '--window-size=470,190']
    }).then(chrome => {
      console.log(`Chrome debugging port running on ${chrome.port}`);
    });
    ChromeLauncher.launch({
      ignoreDefaultFlags: true,
      startingUrl: 'http://localhost:3000/speaker',
      chromeFlags: ['--app=http://localhost:3000/speaker', '--window-size=300,200']
    }).then(chrome => {
      console.log(`Chrome debugging port running on ${chrome.port}`);
    });
  }
}
ws.on('open', function open() {
  console.log('> Connection established\n');
  ws.send(wsmessage('bot-client', true));
  if (process.platform === "win32") {
    openControlsWindow();
  };
});
ws.on('message', function incoming(depeche) {
  depeche = JSON.parse(depeche);
  switch (depeche.event) {
    case 'clip-data':
      Bot.say(`/me   ▶ Проигрывается ${JSON.parse(depeche.message).items[0].snippet.title}`);
      break;
    case 'queue-warn':
      Bot.say(`ItsBoshyTime ${depeche.chatter}, твоя очередь еще не пришла`);
      break;
    case 'queue':
      let users = []
      depeche.message.forEach((user) => {
        users.push(user.username);
      });
      Bot.say(users.length>0?`Кулдаун на воспроизведение клипов у : ${users}`:`Список пуст.`);
      break;
    case 'clip-error':
      Bot.say(depeche.message);
      break;
    case 'ytcd':
      Bot.say(`@${depeche.message}, осталось еще ${depeche.cooldown}`);
      break;
    case 'ytcd-error':
      Bot.say(`@${depeche.message}, ты не на кулдауне`);
      break;
  }
});

Bot.on('join', channel => {
  loader.stop();
  console.log(`Joined channel: \x1b[1m${channel}\x1b[0m \x1b[32m⚫\x1b[0m`);
  console.log(`> Start at      \x1b[1m${Timestamp.stamp()}\x1b[0m`);
  console.log(`> Manual mode   ${conf.manual ? '\x1b[1m\x1b[33menabled\x1b[0m!': 'disabled'}`);
  console.log(`> WEB view      ${conf.web ? '\x1b[1m\x1b[33menabled\x1b[0m on ws://localhost:3000':'\x1b[1m\x1b[31mdisabled\x1b[0m'}`);
  console.log(`> Silent mode   ${conf.silent ? '\x1b[1m\x1b[31menabled\x1b[0m': 'disabled'}`);
  console.log(`> Chat mode     ${conf.chat ? '\x1b[1m\x1b[33menabled\x1b[0m!': 'disabled'}`);
  console.log(`> Player        \x1b[1m${conf.player.type}\x1b[0m\n`)
  bark.start();
});

Bot.on('error', err => {
  console.log('\x1b[31m' + err.message + '\x1b[0m');
  Table.build(err);
})

Bot.on('message', async chatter => {
  console.log(chatter);
  if (chatter.custom_reward_id) {
    if (chatter.custom_reward_id == 'aadd172a-8d1d-4cda-9282-06ad218bfecf') {
	ws.send(JSON.stringify({event: 'bot-play', message: chatter.message, chatter: chatter.username}))
    }
  }
  if (chatter.msg_id) {
    if (chatter.msg_id == 'highlighted-message') {
      ws.send(wsmessage('speaker-message', chatter.message));
    }
  }
  if (conf.web) ws.send(wsmessage('log', chatter.message));
  if (conf.chat) { console.log(`> BOT | \x1b[1m[ CHAT ]\x1b[0m\x1b[2m ${Timestamp.stamp()} \x1b[0m\x1b[47m\x1b[30m ${ParseBadges(chatter.badges)} \x1b[0m \x1b[1m${chatter.username}\x1b[0m: ${chatter.message}`); };
  if (!partyGathering) {
    for (let command in sounds) {
      if (chatter.message == conf.prefix + command) {
        Player.play(sounds[command].path, sounds[command].delay);
      }
    }
  }
  if (chatter.message.includes(conf.prefix + 'yt')) {
    let link = chatter.message.split(/\s/)[1];
    if (CheckSub(ParseBadges(chatter.badges)) || Queue.checkWhitelist(chatter.username)) {
      ws.send(JSON.stringify({event: 'bot-play', message: link, chatter: chatter.username}))
    }
  };
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
          };
        });
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
            Bot.say(`OhMyDog Текущий MMR на мейне: ${conf.mmr}`)
          break;
          case '!roll':
            Bot.say(`${chatter.username} нароллил: ${RNG.randomize(0, 101)} BlessRNG`);
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
          case '!queue':
            if (CheckPrevilegies(chatter)) ws.send(wsmessage('req-queue', true));
          break;
          case '!cd':
            ws.send(wsmessage('req-ytcd', chatter.username));
          break;
          case '!караока':
            ws.send('');
          break;
          case '!players':
            if (party.players) { Bot.say(`Сейчас со стримером играют: ${party.players}`);}
          else { Bot.say("Пати со стримером еще не собиралось.")}
          break;
        }
      }
    });

Bot.on('subscription', event => {
  Bot.say(`${event.login}, спасибо за подписку, братик! PogChamp. Получай смайлик и возможность ставить свою музыку на стриме!`);
  Table.build(event, true);
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
  // manual = new Manual(logger);
  readline.emitKeypressEvents(process.stdin);
  let stdin = process.openStdin();
      stdin.setRawMode(true);
      stdin.setEncoding( 'utf8' );
  let command = '';
  stdin.on('keypress', function (str, key) {
    command = command + str;
    // console.log(key);
      if ( key.name === 'backspace') {
        if (command!=='') {
          command = command.slice(0, -2);
        }
      }
      if (key.sequence === '\r') {
        if (command.includes('$fd')) {
          // stream.getFirstFollows();
        } else if (command.includes('$fc')) {
              let old_d = command.split(/\s/)[1];
              let new_d = command.split(/\s/)[2];
              // console.log(new_d, ' > ', old_d);
              if (new_d = 'today') {
                stream.compare(old_d, Timestamp.format(new Date()));
              } else {
                stream.compare(old_d, new_d);
            }
        } else if (command.includes('$say')) {
          Bot.say(command.split(`$say`)[1].trim());
        } else if (command.includes('$info')) {
            // stream.info();
        } else if (command.includes('$sd')) {
            stream.showDumps();
        } else if (command.includes('$v')) {
            ws.send(JSON.stringify({event: 'bot-play', message: 'https://www.youtube.com/watch?v=hTWKbfoikeg', chatter: 'OHMYDOG'}));
        }
        command = '';
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${command}`);
      }
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${command}`);
      if ( key.sequence === '\u0003' ) {
          process.stdout.write(`\n`);
            process.exit();
      }
  });
}
