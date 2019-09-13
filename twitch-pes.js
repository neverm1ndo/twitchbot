'use strict'

const fs = require('fs');

const Table = require('./lib/table.module.js');
const Timestamp = require('./lib/timestamp.module.js');
const Player = require('./lib/player.module.js');

const TwitchBot = require('twitch-bot')
const request = require('request');
const conf = require('./configs/bot.config.js');

let stream, _stream;
let botStartDate = new Date();
let environment = fs.readFileSync("environment.json");

const Bot = new TwitchBot(JSON.parse(environment).bot);

const dictionary = JSON.parse(fs.readFileSync("./etc/banned.words.dict.json")).words;
const sounds = JSON.parse(fs.readFileSync("./etc/sounds.library.json"));


function links() {
  Bot.say(`DOTABUFF: ${conf.links.dotabuff} || VK: ${conf.links.vk} || Узнать цены на буст: ${conf.links.site}`)
};

function $timeout(message, index) {
    setTimeout(()=> {
      Bot.say(message);
      // console.log(`> BOT | AutoMessage #${index} ${Timestamp.stamp()}: ${message}`);
    }, conf.delay*index);
}

function autoPost() {
  setInterval(()=> {
    links();
    $timeout('Подробный гайд от бустера на Ember Spirit: https://vk.com/@necessaryevil_boost-ember-spirit-kratkii-ekskurs-v-mir-legkih-25', 1);
    $timeout(`Поддержи стримлера: ${conf.links.donationalerts}`, 2);
  }, conf.interval);
}

async function uptime() {
  if (!stream) {
    await _stream;
  }
  return await new Promise((resolve, reject) => {
    let start = stream.started_at;
    let range = new Date(Date.now() - Date.parse(start));
    if (stream) {
      console.log(`> BOT | Success !uptime request: \x1b[32m${Timestamp.parse(range)}\x1b[0m | Данные получены с сервера Twitch`);
      resolve(`Стрим идет уже ${Timestamp.parse(range)}`);
    } else {
      reject();
    }
  }).then(resolve => { Bot.say(resolve) })
    .catch(err => {
      console.log(`> BOT | Error !uptime request: \x1b[31m${err.message}\x1b[0m | Countdown from the start of the bot started...`);
      Bot.say(`Стрим идет ${Timestamp.parse(Date.now() - Date.parse(botStartDate))} `);
     });
}

function roll() {
  return Math.floor(Math.random()*100);
};

Bot.on('join', channel => {
  console.log(`Joined channel: \x1b[30m\x1b[42m${channel}\x1b[0m`);
  console.log(`> Start at ${Timestamp.stamp()}`);
  autoPost();
  _stream = new Promise((resolve, reject) => {
    process.stdout.write(`> BOT | Pending stream info from ${conf.api.url + conf.api.id} ... `);
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
    console.log('| \x1b[32mSUCCESS!\x1b[0m');
    console.log( `      | ----> \x1b[32mAll stream info successfully received\x1b[0m\n`);
    Table.build(res);
  }).catch((err)=> {
    console.log( `| \x1b[31mERROR\x1b[0m`);
    console.log( `      | ----> \x1b[31mStream is offline or just started\x1b[0m\n`);
  });
});

Bot.on('error', err => {
  console.log('\x1b[31m' + err.message + '\x1b[0m');
})

Bot.on('message', chatter => {
  if (!chatter.mod) {
    dictionary.forEach((word)=> {
      if (chatter.message.includes(word)) {
        Bot.ban(chatter.username, 'Спам');
        console.warn(`> BOT | Catched banned word \x1b[1m\x1b[31m${word}\x1b[0m! Banned user \x1b[1m\x1b[31m${chatter.username}\x1b[0m`);
      }
    });
  }
  for (let command in sounds) {
      if (chatter.message == '!' + command) {
        Player.play(sounds[command]);
      }
  }
  switch (chatter.message) {
    case '!info':
        links();
      break;
    case '!mmr':
      Bot.say('Текущий MMR на мейне: 6200 OhMyDog')
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
    }
});

Bot.on('subscription', event => {
  Bot.say(`${event.login}, спасибо за подписку, братик! PogChamp`);
});

Bot.on('ban', event => {
  Table.build(event);
});
