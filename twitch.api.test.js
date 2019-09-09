'use strict'

const request = require('request');

const headers = {
    'Accept':  'application/vnd.twitchtv.v5+json',
    'Content-Type' : 'application/json',
    'Client-ID': 'ezap2dblocyxqnsjhl9dpyw1jpn8c7'
  }
const api = 'https://api.twitch.tv/helix/streams?user_id=32184566'

function getChannelId() {
  request({url: 'https://api.twitch.tv/kraken/users?login=rxnexus', method: 'GET', headers: headers}, (error, response, body)=> {
    console.log('Name: ', JSON.parse(body).users[0].display_name);
    console.log('ID: ', JSON.parse(body).users[0]._id);
  })
}

function uptime() {
  let options = {
      url: api,
      method: 'GET',
      headers: headers
  }
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          let start = JSON.parse(body).data[0].started_at;
          let range = new Date(Date.now() - Date.parse(start));
          let hours = range.getHours();
          let minutes = range.getMinutes();
          let seconds = range.getSeconds();
          // if (hours !== '0') {
            // return hours + ':' + minutes + ':' + seconds;
            console.log(hours, minutes, seconds);
          // }
      } else {
        console.log(error.message);
      }
  })
};
// getChannelId();
uptime();
