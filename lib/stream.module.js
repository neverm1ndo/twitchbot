const Timestamp = require('./timestamp.module.js');
const Table = require('./table.module.js');
const request = require('request');
const fs = require('fs');
let readline = require('readline');
module.exports = class Stream {

  constructor(twitch, bot) {
    this.twitch = twitch;
    this.stream;
    this.bot = bot;
    this.follows = [];
    this.pagination = {};
    this.total = 0;
    this.unfollowed = [];
    this.followed = [];
  }

  get unfol() {
    return this.unfollowed;
  }

  get ttl() {
    return this.total;
  }

  saveDump(dump) {
    let date = Timestamp.format(new Date())
    fs.writeFile(`./dumps/${date}.json`, JSON.stringify(dump) , function(err) {
      if(err) { return console.log(err); }
    });
  }

  getFirstFollows() {
    new Promise((resolve, reject) => {
      let options = {
        url: `https://api.twitch.tv/helix/users/follows?to_id=${this.twitch.api.id}&first=100`,
        method: 'GET',
        headers: this.twitch.headers
      };
      request(options,(error, response, body) => {
        if (!error && response.statusCode == 200) {
          let data = JSON.parse(body);
          if (data) {
            resolve(data);
          } else {
            reject(error);
          }
        } else {
          reject(error);
          }
        })
    }).then((body) => {
      this.total = body.total;
      this.pagination = body.pagination;
      this.follows.push(body.data);
      this.getOther();
    }).catch((err) => {
      console.log(err);
    });
  }

  async getOther() {
    for (let i = 0; i < this.total/100; i++) {
      await new Promise((resolve, reject) => {
        let options = {
          url: `https://api.twitch.tv/helix/users/follows?to_id=${this.twitch.api.id}&first=100&after=${this.pagination.cursor}`,
          method: 'GET',
          headers: this.twitch.headers
        };
        request(options,(error, response, body) => {
          if (!error && response.statusCode == 200) {
            let data = JSON.parse(body);
            if (data) {
              resolve(data);
            } else {
              reject(error);
            }
          } else {
            reject(error);
          }
        })
      }).then((body) => {
        this.pagination = body.pagination;
        this.follows.push(body.data);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`> BOT | \x1b[1m[STREAM]\x1b[0m Dumping followers list... ${ Math.round((i+1)*100/(this.total/100))}% | ${this.pagination.cursor?this.pagination.cursor:"finished"}`);
        if (i+1 >= this.total/100) {
          let glued = [];
          let nicknames = [];
          for (let i = 0; i < this.follows.length; i++) {
            glued = glued.concat(this.follows[i]);
          }
          for (let i = 0; i < glued.length; i++) {
            nicknames.push(glued[i].from_name);
          }
          this.saveDump(nicknames);
          process.stdout.write(`\n`);
          console.log(`> BOT | \x1b[1m[STREAM]\x1b[0m Dump is ready in /dumps`);
        }
      }).catch((err) => {
        console.log(err);
      });
    }
  };

  compare(old_d, new_d) {
      let olddump = JSON.parse(fs.readFileSync("./dumps/" + old_d + ".json"));
      let newdump = JSON.parse(fs.readFileSync("./dumps/" + new_d + ".json"));

      olddump.forEach((oldfollow) => {
        if (!newdump.includes(oldfollow)) {
          this.unfollowed.push(oldfollow);
        }
      });
      newdump.forEach((newfollow) => {
        if (!olddump.includes(newfollow)) {
          this.followed.push(newfollow);
        };
      })

      console.log(`> BOT │ \x1b[1m[STREAM]\x1b[0m dump statistics :`);
      console.log(`      ├─ Total followers now ${new_d} : ${newdump.length} users`);
      console.log(`      ├─ \x1b[41mUnfollowed\x1b[0m from ${old_d} to ${new_d} : ${this.unfollowed.length} users`);
      console.log('      ├─',this.unfollowed);
      console.log(`      ├─ \x1b[42mFollowed\x1b[0m from ${old_d} to ${new_d} : ${this.followed.length} users`);
      console.log('      └─',this.followed);
  };

  uptime() {
    if (!this.stream) {
      this.info();
    }
    return new Promise((resolve, reject) => {
      let start = this.stream.started_at;
      let range = new Date(Date.now() - Date.parse(start));
      if (this.stream) {
        console.log(`> BOT | Success !uptime request: \x1b[32m${Timestamp.parse(range)}\x1b[0m | Данные получены с сервера Twitch`);
        resolve(`OhMyDog Стрим идет уже ${Timestamp.parse(range)}`);
      } else {
        reject();
      }
    }).then(resolve => { this.bot.say(resolve) })
      .catch(err => {
        console.log(`> BOT | Error !uptime request: \x1b[31m${err.message}\x1b[0m | Countdown from the start of the bot started...`);
        this.bot.say(`OhMyDog Стрим оффлайн`);
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
