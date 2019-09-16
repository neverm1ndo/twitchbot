'use strict'

const fs = require('fs');

const Table = require('./lib/table.module.js');
const Timestamp = require('./lib/timestamp.module.js');
const Player = require('./lib/player.module.js');
const Party = require('./lib/party.module.js');
const Manual = require('./lib/manual.module.js');

const TwitchBot = require('twitch-bot')
const request = require('request');
const conf = require('./configs/bot.config.js');

let stream, _stream, partyGathering, party, manual;
let botStartDate = new Date();
let environment = JSON.parse(fs.readFileSync("environment.json"));

const Bot = new TwitchBot(environment.bot);

const dictionary = JSON.parse(fs.readFileSync("./etc/banned.words.dict.json")).words;
const sounds = JSON.parse(fs.readFileSync("./etc/sounds.library.json"));

function links() {
  Bot.say(`DOTABUFF: ${conf.links.dotabuff} ||| VK: ${conf.links.vk} ||| Узнать цены на буст: ${conf.links.site}`)
};

function $timeout(message, index) {
    setTimeout(()=> {
      Bot.say(message);
      // console.log(`> BOT | AutoMessage #${index} ${Timestamp.stamp()}: ${message}`);
    }, conf.delay*index);
}

function checkPrevilegies(chatter) {
  return (chatter.mod || chatter.badges.streamer);
}

function autoPost() {
  setInterval(()=> {
    links();
    $timeout('OhMyDog Подробный гайд от бустера на Ember Spirit: https://vk.com/@necessaryevil_boost-ember-spirit-kratkii-ekskurs-v-mir-legkih-25', 1);
    $timeout(`OhMyDog Поддержи стримлера: ${conf.links.donationalerts}`, 2);
  }, conf.interval);
}

async function uptime() {
  if (!stream) {
    getStreamInfo();
  }
  return await new Promise((resolve, reject) => {
    let start = stream.started_at;
    let range = new Date(Date.now() - Date.parse(start));
    if (stream) {
      console.log(`> BOT | Success !uptime request: \x1b[32m${Timestamp.parse(range)}\x1b[0m | Данные получены с сервера Twitch`);
      resolve(`OhMyDog Стрим идет уже ${Timestamp.parse(range)}`);
    } else {
      reject();
    }
  }).then(resolve => { Bot.say(resolve) })
    .catch(err => {
      console.log(`> BOT | Error !uptime request: \x1b[31m${err.message}\x1b[0m | Countdown from the start of the bot started...`);
      Bot.say(`OhMyDog Стрим идет ${Timestamp.parse(Date.now() - Date.parse(botStartDate))} `);
     });
}

function roll() {
  return Math.floor(Math.random()*100);
};

function getStreamInfo() {
  _stream = new Promise((resolve, reject) => {
    process.stdout.write(`> BOT | Pending stream info from Twitch.tv ... `);
    let options = {
      url: conf.api.url + conf.api.id,
      method: 'GET',
      headers: conf.headers
    };
    request(options,(error, response, body) => {
      if (!error && response.statusCode == 200) {
        let data = JSON.parse(body).data;
        if (data[0]) {
          resolve(data[0]);
        } else {
          reject();
        }
      } else {
        reject();
        }
      })
  }).then(res => {
    stream = res ;
    console.log('| \x1b[32m\x1b[1mSUCCESS!\x1b[0m');
    console.log( `      └───> \x1b[32mAll stream info successfully received\x1b[0m\n`);
    Table.build(res);
  }).catch((err)=> {
    console.log( `| \x1b[31m\x1b[1mERROR\x1b[0m`);
    console.log( `      └───> \x1b[31mStream is offline or just started\x1b[0m\n`);
  });
}

Bot.on('join', channel => {
  console.log(`Joined channel: \x1b[1m${channel}\x1b[0m \x1b[32m⚫\x1b[0m`);
  console.log(`> Start at \x1b[1m${Timestamp.stamp()}\x1b[0m`);
  console.log(`> Manual mode ${conf.manual ? '\x1b[1m\x1b[31menabled\x1b[0m!': 'disabled'}`);
  console.log(`> Player : \x1b[1m${conf.player.type}\x1b[0m\n`)
  autoPost();
  getStreamInfo();
});

Bot.on('error', err => {
  console.log('\x1b[31m' + err.message + '\x1b[0m');
  Table.build(err);
})

Bot.on('message', chatter => {
  if (partyGathering) {
    if (chatter.message == '+') {
      party.gathering(chatter);
    }
  }
  if (!checkPrevilegies(chatter)) {
    dictionary.forEach((word)=> {
      if (chatter.message.includes(word)) {
        console.warn(`> BOT | Catched banned word \x1b[1m\x1b[31m${word}\x1b[0m!\n      └───> Banned user \x1b[1m\x1b[31m${chatter.username}\x1b[0m`);
        Bot.ban(chatter.username);
      }
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
    if (checkPrevilegies(chatter) && !partyGathering) {
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
    case '!donate':
      Bot.say(`OhMyDog Поддержи стримлера: ${conf.links.donationalerts}`)
      break;
    case '!roll':
      Bot.say(`${chatter.username} нароллил: ` + roll() + ' BlessRNG');
      break;
    case '!uptime':
        uptime();
      break;
    case '!s':
      if (checkPrevilegies(chatter) && partyGathering) {
        partyGathering = false;
        Bot.say(party.stack());
      };
      break;
    }
});

Bot.on('subscription', event => {
  Bot.say(`${event.login}, спасибо за подписку, братик! PogChamp`);
});

Bot.on('ban', event => {
  console.log(`> BOT | \x1b[31m\x1b[1m[ BAN ]\x1b[0m : ${Timestamp.stamp()} Ban event info:`);
  Table.build(event);
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
      getStreamInfo();
    } else {
      manual.error();
    }
  });
}
