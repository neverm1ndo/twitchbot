'use strict'

const fs = require('fs');

const Table = require('./lib/table.module.js');
const Timestamp = require('./lib/timestamp.module.js');
const Player = require('./lib/player.module.js');
const Party = require('./lib/party.module.js');
const Manual = require('./lib/manual.module.js');
const Loader = require('./lib/loader.module.js');
const RNG = require('./lib/rng.module.js');
const Bark = require('./lib/bark.module.js');
const Stream = require('./lib/stream.module.js');

const TwitchBot = require('twitch-bot')
const request = require('request');
const conf = require('./configs/bot.config.js');

let partyGathering, party, manual;
let botStartDate = new Date();
let loader = new Loader();
let environment = JSON.parse(fs.readFileSync("environment.json"));

const Bot = new TwitchBot(environment.bot);

const dictionary = JSON.parse(fs.readFileSync("./etc/banned.words.dict.json")).words;
const sounds = JSON.parse(fs.readFileSync("./etc/sounds.library.json"));
const automessages = JSON.parse(fs.readFileSync("./etc/automessages.list.json")).mod;

const bark = new Bark(conf, automessages, Bot);
const stream = new Stream({api: conf.api, headers: conf.headers});

//*************************************************************************************************************//

function CheckPrevilegies(chatter) {
  return (chatter.mod || (chatter.badges.broadcaster !== null));
}

Bot.on('join', channel => {
  loader.stop();
  console.log(`Joined channel: \x1b[1m${channel}\x1b[0m \x1b[32m⚫\x1b[0m`);
  console.log(`> Start at \x1b[1m${Timestamp.stamp()}\x1b[0m`);
  console.log(`> Manual mode ${conf.manual ? '\x1b[1m\x1b[33menabled\x1b[0m!': 'disabled'}`);
  console.log(`> Player : \x1b[1m${conf.player.type}\x1b[0m\n`)
  bark.start();
  stream.info();
});

Bot.on('error', err => {
  console.log('\x1b[31m' + err.message + '\x1b[0m');
  Table.build(err);
})

Bot.on('message', async chatter => {
  if (partyGathering) {
    if (chatter.message == '+') {
      party.gathering(chatter);
    }
  }
  if (!CheckPrevilegies(chatter)) {
    dictionary.forEach((word)=> {
      if (chatter.message.includes(word)) {
        console.warn(`> BOT | Catched banned word \x1b[1m\x1b[31m${word}\x1b[0m!\n      └───> Banned user \x1b[1m\x1b[31m${chatter.username}\x1b[0m`);
        Bot.ban(chatter.username);
      }
    });
  }
  if (!partyGathering && chatter.subscriber) {
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
      Bot.say(`OhMyDog @${chatter.username} собирает пати! Пиши + в чай, если хотите попасть в стак!`);
      console.log(`> BOT | \x1b[1m[ PARTY ]\x1b[0m : ${chatter.username} initiated x${amount} party gathering:\n      | Chatters in queue:`);
      partyGathering = true;
      party = new Party([], amount);
    };
  }
  switch (chatter.message) {
    case '!info':
        links();
      break;
    case '!mmr':
      Bot.say('OhMyDog Текущий MMR на мейне: 6200')
      break;
    case '!roll':
      Bot.say(`${chatter.username} нароллил: ${RNG.randomize(0, 100)} BlessRNG`);
      break;
    case '!uptime':
      Bot.say(await stream.uptime());
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
    }
});

Bot.on('subscription', event => {
  Bot.say(`${event.login}, спасибо за подписку, братик! PogChamp`);
  Table.build(event, true);
});

Bot.on('ban', event => {
  console.log(`> BOT | \x1b[31m\x1b[1m[ BAN ]\x1b[0m : ${Timestamp.stamp()} Ban event info:`);
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
    } else if (c.includes(`$streamstatus`)) {
      stream.info();
    } else {
      manual.error();
    }
  });
}
