const Timestamp = require('./timestamp.module.js');
const Table = require('./table.module.js');
const request = require('request');
const fs = require('fs');
let readline = require('readline');
const chalk = require('chalk');
module.exports = class Stream {

  constructor(twitch, bot, logger) {
    this.logger = logger;
    this.twitch = twitch;
    this.stream;
    this.bot = bot;
    this.follows = [];
    this.pagination = {};
    this.total = 0;
    this.unfollowed = [];
    this.followed = [];
    this.mod = 'SYSTEM';
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
    this.logger.clearSysLog();
    process.stdout.write(`\x1b[${3};${this.logger.syswidth + 3}H\x1b[0K \x1b[1mDUMPS\x1b[0m`);
    process.stdout.write(`\x1b[${6};${this.logger.syswidth + 4}H\x1b[0K ${chalk.hex('#FF00FF').bold('$SYSTEM')} Requesting list of followers`);
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
      process.stdout.write(`\x1b[${7};${this.logger.syswidth + 4}H\x1b[0K ${chalk.hex('#FF00FF').bold('$SYSTEM')} Recieved`);
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
        process.stdout.write(`\x1b[${8};${this.logger.syswidth + 4}H\x1b[0K ${chalk.hex('#FF00FF').bold('$SYSTEM')} Dumping followers list... ${ Math.floor((i)*100/(this.total/100))}%\x1b[${9};${this.logger.syswidth + 4}H\x1b[0K ${this.pagination.cursor?this.pagination.cursor.slice(35, this.pagination.cursor.length):"finished"}`);
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
          process.stdout.write(`\x1b[${10};${this.logger.syswidth + 4}H\x1b[0K ${chalk.hex('#FF00FF').bold('$SYSTEM')} Dump ${Timestamp.format(new Date())} is ready in /dumps`);
          process.stdout.write(`\x1b[${11};${this.logger.syswidth + 4}H\x1b[0K ${chalk.hex('#FF00FF').bold('$SYSTEM')} Dumped ${nicknames.length} nicknames`);

        }
      }).catch((err) => {
        console.log(err);
      });
    }
  };

  compare(old_d, new_d) {
      this.logger.clearSysLog();
      let followed = [];
      let unfollowed = [];
      let olddump = JSON.parse(fs.readFileSync("./dumps/" + old_d + ".json"));
      let newdump = JSON.parse(fs.readFileSync("./dumps/" + new_d + ".json"));

      olddump.forEach((oldfollow) => {
        if (!newdump.includes(oldfollow)) {
          unfollowed.push(oldfollow);
        }
      });
      newdump.forEach((newfollow) => {
        if (!olddump.includes(newfollow)) {
          followed.push(newfollow);
        };
      })

      process.stdout.write(`\x1b[${6};${this.logger.syswidth + 4}H\x1b[0K Statistics :`);
      process.stdout.write(`\x1b[${7};${this.logger.syswidth + 4}H\x1b[0K Total followers now ${new_d} : ${newdump.length} users`);
      process.stdout.write(`\x1b[${8};${this.logger.syswidth + 4}H\x1b[0K \x1b[42mFollowed\x1b[0m from ${old_d} to ${new_d} : ${followed.length} users`);
      followed.forEach((user, index) => {
        if (index%2==1) {
          process.stdout.write(`\x1b[${10 + Math.round(index/2) - 1};${this.logger.syswidth + 4 + 20}H ${chalk.hex('#00FF00').bold(user)}`);
        } else {
          process.stdout.write(`\x1b[${10 + Math.round(index/2)};${this.logger.syswidth + 4}H ${chalk.hex('#00FF00').bold(user)}`);
        }
      });
      process.stdout.write(`\x1b[${12 + Math.ceil(followed.length/2)};${this.logger.syswidth + 4}H\x1b[0K\x1b[41mUnfollowed\x1b[0m from ${old_d} to ${new_d} : ${unfollowed.length} users`);
        unfollowed.forEach((user, index) => {
          if (index%2==1) {
            process.stdout.write(`\x1b[${14 + Math.ceil(followed.length/2) + Math.round(index/2) - 1};${this.logger.syswidth + 4 + 20}H ${chalk.hex('#FF0000').bold(user)}`);
          } else {
            process.stdout.write(`\x1b[${14 + Math.ceil(followed.length/2) + Math.round(index/2)};${this.logger.syswidth + 4}H ${chalk.hex('#FF0000').bold(user)}`);
          }
      });
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
      this.logger.syslog(this.mod, `Pending stream info from Twitch.tv ... `);
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
      this.logger.syslog(this.mod, `| \x1b[32m\x1b[1mSUCCESS!\x1b[0m
            \x1b[${this.logger.syswidth - 1}C`);
      this.logger.syslog(this.mod, `└───> \x1b[32mAll stream info successfully received`);
      process.stdout.write('\x1b[0m');
      Table.build(res, true ,this.logger.syswidth + 2, this.logger.syswidth/2);
      this.logger.canvas();
    }).catch((err)=> {
      // console.log(err);
      this.logger.syslog(this.mod, `| \x1b[31m\x1b[1mERROR\x1b[0m\x1b[${this.logger.syswidth - 1}C`);
      this.logger.syslog(this.mod, `└───> \x1b[31mStream is offline\x1b[0m`);
      process.stdout.write('\x1b[0m');
    });
  }
}
