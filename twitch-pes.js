'use strict'

const TwitchBot = require('twitch-bot')
const request = require('request');

const conf = {
  interval : 600000, // глобальный кулдаун автоматического постинга ссылок <- 10min
  delay : 120000, // делей между различными ссылками <- 2 min
  links : {
    vk: 'https://vk.com/necessaryevil0',
    donationalerts: 'https://www.donationalerts.com/r/necessaryevil0',
    site: 'https://necessaryboost.pro/',
    dotabuff: 'https://www.dotabuff.com/players/120494497',
  },
  headers: {
    'Accept':  'application/vnd.twitchtv.v5+json',
    'Content-Type' : 'application/json',
    'Client-ID': 'ezap2dblocyxqnsjhl9dpyw1jpn8c7'
  },
  api: {
    id: '133676909', //Это твой ID на твиче
    url : 'https://api.twitch.tv/helix/streams?user_id=',
  }
};

let stream;
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
      console.log(`> BOT | AutoMessage #${index} : ${message}`);
    }, conf.delay*index);
}

  let _stream = new Promise((resolve, reject) => {
    let options = {
      url: conf.api.url + conf.api.id,
      method: 'GET',
      headers: conf.headers
    };
    request(options,(error, response, body) => {
      if (!error && response.statusCode == 200) {
        resolve(JSON.parse(body).data[0]);
      } else {
        console.log( `> BOT | Error: \x1b[31m${error.message}\x1b[0m`);
        reject(err);
        }
      })
  }).then(res => { stream = res })
    .catch((err)=> {console.error(err);});

function autoPost() {
  setInterval(()=> {
    links();
    $timeout('Подробный гайд от бустера на Ember Spirit: https://vk.com/@necessaryevil_boost-ember-spirit-kratkii-ekskurs-v-mir-legkih-25', 1);
    $timeout(`Поддержи стримлера: ${conf.links.donationalerts}`, 2);
  }, conf.interval);
}

function convertNum(str) {
  let pad = "00"
  return pad.substring(0, pad.length - str.length) + str;
}

function timeParse(time) {
  let date = new Date(time);
  let hours = (date.getHours() - 3).toString();
  let minutes = date.getMinutes().toString();
  let seconds = date.getSeconds().toString();
  return `${convertNum(hours)}:${convertNum(minutes)}:${convertNum(seconds)}`;
}

async function uptime() {
  if (!stream) {
    await _stream;
  }
  return await new Promise((resolve, reject) => {
    let start = stream.started_at;
    let range = new Date(Date.now() - Date.parse(start));
    if (stream) {
      resolve(`Стрим идет уже ${timeParse(time)}`);
    } else {
      reject();
    }
  }).then(resolve => { Bot.say(resolve) })
    .catch(err => {
      Bot.say(`Стрим идет ${timeParse(Date.now() - Date.parse(botStartDate))} `);
      console.log(`> BOT | Error: \x1b[31m${err.message}\x1b[0m`);
     });
}

function roll() {
  return Math.floor(Math.random()*100);
};


Bot.on('join', channel => {
  console.log(`Joined channel: \x1b[30m\x1b[42m${channel}\x1b[0m`);
  console.log(`> Start at ${new Date()}`);
  autoPost();
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
})
