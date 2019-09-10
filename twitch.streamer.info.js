'use strict'

const request = require('request');

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
    console.log('-----------------------------------------------');
    console.log('| Name    | ', JSON.parse(body).users[0].display_name );
    console.log('| ID      | ', JSON.parse(body).users[0]._id);
    console.log('| Type    | ', JSON.parse(body).users[0].type);
    console.log('| Bio     | ', JSON.parse(body).users[0].bio);
    console.log('| Created | ', JSON.parse(body).users[0].created_at);
    console.log('| Updated | ', JSON.parse(body).users[0].updated_at);
    console.log('-----------------------------------------------');
  }).catch( err => {
    console.error('Error: Нет такого никнейма | ', err.message);
  });
}
