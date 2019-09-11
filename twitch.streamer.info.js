'use strict'

const request = require('request');
const Table = require('./lib/table.module.js');

const headers = {
    'Accept':  'application/vnd.twitchtv.v5+json',
    'Content-Type' : 'application/json',
    'Client-ID': 'ezap2dblocyxqnsjhl9dpyw1jpn8c7'
  }
const api = 'https://api.twitch.tv/helix/streams?user_id=32184566';

let stdin = process.openStdin();

console.log('Enter streamers nickname below: ')

stdin.addListener("data", function(d) {
    getChannelId(d.toString().trim());
});

function getChannelId(nickname) {
  new Promise((resolve, reject)=> {
    request({url: `https://api.twitch.tv/kraken/users?login=${nickname}`, method: 'GET', headers: headers}, (error, response, body)=> {
      if(body) {
        resolve(body)
      } else {
        reject(err);
      }
    })
  }).then(body => {
    Table.build(JSON.parse(body).users[0]);
  }).catch( err => {
    console.error('Error: Нет такого никнейма | ', err.message);
  });
}
