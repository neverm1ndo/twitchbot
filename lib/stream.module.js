const Timestamp = require('./timestamp.module.js');
const Table = require('./table.module.js');

module.exports = class Stream {

  constructor(twitch) {
    this.twitch = twitch;
    this.stream;
  }

  uptime() {
    if (!this.stream) {
      this.info();
    }
    return new Promise((resolve, reject) => {
      let start = this.stream.started_at;
      let range = new Date(Date.now() - Date.parse(this.start));
      if (this.stream) {
        console.log(`> BOT | Success !uptime request: \x1b[32m${Timestamp.parse(range)}\x1b[0m | Данные получены с сервера Twitch`);
        resolve(`OhMyDog Стрим идет уже ${Timestamp.parse(range)}`);
      } else {
        reject();
      }
    }).then(resolve => { return resolve })
      .catch(err => {
        console.log(`> BOT | Error !uptime request: \x1b[31m${err.message}\x1b[0m | Countdown from the start of the bot started...`);
        return (`OhMyDog Стрим оффлайн`);
       });
  }
  info() {
    new Promise((resolve, reject) => {
      process.stdout.write(`> BOT | Pending stream info from Twitch.tv ... `);
      let options = {
        url: this.twitch.api.url + this.twitch.api.id,
        method: 'GET',
        headers: this.twitch.headers
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
      this.stream = res ;
      console.log('| \x1b[32m\x1b[1mSUCCESS!\x1b[0m');
      console.log( `      └───> \x1b[32mAll stream info successfully received\x1b[0m\n`);
      Table.build(res);
    }).catch((err)=> {
      console.log( `| \x1b[31m\x1b[1mERROR\x1b[0m`);
      console.log( `      └───> \x1b[31mStream is offline\x1b[0m\n`);
    });
  }
}
