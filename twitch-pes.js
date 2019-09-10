'use strict'

const Table = require('./lib/table.module.js');
const Timestamp = require('./lib/timestamp.module.js');

const TwitchBot = require('twitch-bot')
const request = require('request');
const conf = require('./bot.config.js');

let stream, _stream;
let botStartDate = new Date();

const Bot = new TwitchBot({
  username: 'evilsobakabot',
  oauth: 'oauth:qg834r817uk9c9vc7vqhm46vaej8td',
  channels: ['necessaryevil0']
})

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
      console.log(`> BOT | Success !uptime request: \x1b[32m${Timestamp.time(range, 3)}\x1b[0m | Данные получены с сервера Twitch`);
      resolve(`Стрим идет уже ${Timestamp.time(range, 3)}`);
    } else {
      reject();
    }
  }).then(resolve => { Bot.say(resolve) })
    .catch(err => {
      console.log(`> BOT | Error !uptime request: \x1b[31m${err.message}\x1b[0m | Countdown from the start of the bot started...`);
      Bot.say(`Стрим идет ${Timestamp.time(Date.now() - Date.parse(botStartDate), 3)} `);
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
  console.log('\x1b[31m' + err + '\x1b[0m');
})

Bot.on('message', chatter => {
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
    case '!info':
        links();
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
